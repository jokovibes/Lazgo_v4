
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxtnwwdbaceipahfqwpv.supabase.co';
const supabaseKey = 'sb_publishable_GPvV2yfDhqL-roGOSZUPKg_xivgrayx';

export const supabase = createClient(supabaseUrl, supabaseKey);
