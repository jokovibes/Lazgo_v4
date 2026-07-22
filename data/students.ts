
export interface StudentInfo {
  name: string;
  className: string;
}

export const students: StudentInfo[] = [  
];

export const classNames: string[] = Array.from(new Set(students.map(s => s.className))).sort();
