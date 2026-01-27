
import { GoogleGenAI } from "@google/genai";
import { TardinessRecord, GeneratedOutput } from '../types';

// Helper to format history
function formatHistory(records: TardinessRecord[]): string {
  if (records.length === 0) {
    return "Belum ada siswa yang terlambat hari ini selain siswa saat ini.";
  }
  return records.map(r => `- ${r.name} (${r.className}): Terlambat ${r.durationMinutes} menit (${r.category})`).join('\n');
}

export async function generateTardinessReport(
  currentRecord: TardinessRecord,
  history: TardinessRecord[]
): Promise<GeneratedOutput> {
  // Always initialize GoogleGenAI with a named parameter and access process.env.API_KEY directly.
  // Creating a new instance right before generating content ensures the latest API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Kamu adalah LazGo, asisten sekolah yang efisien dan profesional untuk mencatat keterlambatan siswa.

    Tugasmu adalah memproses data keterlambatan siswa dan menghasilkan output dalam format yang ditentukan. Selalu gunakan Bahasa Indonesia yang baik dan formal.

    Data Siswa Saat Ini:
    - Nama: ${currentRecord.name}
    - Kelas: ${currentRecord.className}
    - Jam Masuk Seharusnya: ${currentRecord.schoolStartTime}
    - Jam Kedatangan: ${currentRecord.arrivalTime}
    - Durasi Keterlambatan: ${currentRecord.durationMinutes} menit
    - Kategori Keterlambatan: ${currentRecord.category}
    - Alasan: ${currentRecord.reason || 'Tidak ada'}

    Riwayat Keterlambatan Hari Ini (Siswa yang sudah tercatat sebelumnya):
    ${formatHistory(history)}

    ---

    Instruksi:
    Berdasarkan data di atas, hasilkan output dengan format TEPAT seperti di bawah ini. JANGAN tambahkan teks pembuka atau penutup lainnya. Gunakan emoji dan formatting tebal (**...**) yang sudah ditentukan.

    1️⃣ **Ringkasan Keterlambatan**
    [Buat ringkasan singkat dan jelas tentang keterlambatan siswa SAAT INI. Sebutkan nama, kelas, durasi, dan kategori.]

    2️⃣ **Pesan WhatsApp untuk Orang Tua**
    [Buat pesan WhatsApp yang formal, sopan, dan informatif untuk orang tua siswa SAAT INI. Gunakan tanggal hari ini (asumsikan hari ini adalah tanggal saat pesan dibuat). Gunakan format tebal (*...*) and miring (_..._) jika perlu untuk penekanan. Sapa dengan "Yth. Bapak/Ibu Orang Tua/Wali dari ananda [Nama Siswa]".]

    3️⃣ **Rekap Harian**
    [Buat ringkasan dari SEMUA siswa yang terlambat hari ini (termasuk siswa saat ini dari data di atas and riwayat). Jika hanya ada satu siswa, sebutkan "Total Keterlambatan Hari Ini: 1 siswa.". Jika ada lebih dari satu, berikan daftar ringkas dan totalnya.]
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
    });

    // Access the .text property directly (not as a method).
    const text = response.text || "";
    
    const summaryMatch = text.match(/1️⃣\s\*\*Ringkasan Keterlambatan\*\*\s*([\s\S]*?)(?=\s*2️⃣|$)/);
    const whatsappMatch = text.match(/2️⃣\s\*\*Pesan WhatsApp untuk Orang Tua\*\*\s*([\s\S]*?)(?=\s*3️⃣|$)/);
    const dailyRecapMatch = text.match(/3️⃣\s\*\*Rekap Harian\*\*\s*([\s\S]*)/);
    
    const summary = summaryMatch ? summaryMatch[1].trim() : "Gagal memuat ringkasan.";
    const whatsapp = whatsappMatch ? whatsappMatch[1].trim() : "Gagal memuat pesan WhatsApp.";
    const dailyRecap = dailyRecapMatch ? dailyRecapMatch[1].trim() : "Gagal memuat rekap harian.";

    return { summary, whatsapp, dailyRecap };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Tidak dapat terhubung ke AI. Mohon coba lagi.");
  }
}

export async function generateMonthlyReport(records: TardinessRecord[]): Promise<{
  report: string;
  parentMessage: string | null;
  topOffender: { name: string; className: string; count: number } | null;
}> {
    if (records.length === 0) {
        return { report: "Tidak ada data keterlambatan untuk bulan ini.", parentMessage: null, topOffender: null };
    }

    const tardinessCounts: Record<string, { name: string; className: string; count: number }> = {};
    for (const record of records) {
        if (!tardinessCounts[record.name]) {
            tardinessCounts[record.name] = { name: record.name, className: record.className, count: 0 };
        }
        tardinessCounts[record.name].count++;
    }

    const topOffender = Object.values(tardinessCounts).sort((a, b) => b.count - a.count)[0];
    const shouldGenerateParentMessage = topOffender && topOffender.count >= 3;

    const formattedData = records.map(r => 
        `- Tgl: ${new Date(r.id).toLocaleDateString('id-ID')}, Nama: ${r.name}, Kelas: ${r.className}, Terlambat: ${r.durationMinutes} menit, Kategori: ${r.category}`
    ).join('\n');

    // Always use a new GoogleGenAI instance right before making an API call and access process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        Kamu adalah LazGo, seorang analis data sekolah yang cermat dan profesional.
        
        Data Keterlambatan Bulan Ini:
        ${formattedData}
        
        ---
        
        Instruksi:
        Berdasarkan data di atas, hasilkan objek JSON dengan struktur yang TEPAT sebagai berikut:
        {
          "report": "string (dalam format markdown)",
          "parentMessage": "string atau null"
        }
        
        1.  Untuk kunci "report":
            Buatlah laporan analisis markdown yang komprehensif. Laporan harus mencakup:
            - **Laporan Analisis Keterlambatan Bulanan** (sebagai judul utama)
            - **1. Ringkasan Umum**: Total keterlambatan, rata-rata durasi, rincian per kategori.
            - **2. Tren dan Pola Utama**: Identifikasi tren menonjol.
            - **3. Siswa dengan Keterlambatan Terbanyak**: Sebutkan 3-5 siswa teratas beserta jumlah keterlambatannya.
            - **4. Rekomendasi**: Berikan 1-2 rekomendasi singkat dan dapat ditindaklanjuti.
        
        ${shouldGenerateParentMessage
          ? `2. Untuk kunci "parentMessage":
            Siswa yang paling sering terlambat adalah **${topOffender.name}** dari kelas **${topOffender.className}** dengan total **${topOffender.count}** kali keterlambatan.
            Buatkan draf pesan WhatsApp yang formal, sopan, dan konstruktif untuk orang tua/wali siswa tersebut. Awali dengan "Yth. Bapak/Ibu Orang Tua/Wali dari ananda ${topOffender.name}".`
          : `2. Untuk kunci "parentMessage": null`
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        // Access the .text property directly (not as a method).
        const resultJson = JSON.parse(response.text || "{}");
        
        return {
            report: resultJson.report || "Gagal memuat laporan dari AI.",
            parentMessage: resultJson.parentMessage,
            topOffender: shouldGenerateParentMessage ? topOffender : null,
        };
    } catch (error) {
        console.error("Error calling Gemini API for monthly report:", error);
        throw new Error("Gagal memproses laporan bulanan.");
    }
}
