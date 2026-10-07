const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacer) => {
    let content = fs.readFileSync(filePath, 'utf8');
    content = replacer(content);
    fs.writeFileSync(filePath, content);
};

// 1. Locales
replaceInFile('src/locales/teacher.ts', content => 
    content.replace(/classes: \{/g, 'teacherClasses: {').replace(/assignments: \{/g, 'teacherAssignments: {')
);
replaceInFile('src/locales/admin.ts', content => 
    content.replace(/classes: \{/g, 'adminClasses: {')
);
replaceInFile('src/locales/student.ts', content => 
    content.replace(/assignments: \{/g, 'studentAssignments: {')
);

// 2. Pages
replaceInFile('src/pages/TeacherClassProgress.tsx', content => 
    content.replace(/t\(['"]classes\./g, 't(\'teacherClasses.')
);
replaceInFile('src/pages/TeacherClasses.tsx', content => 
    content.replace(/t\(['"]classes\./g, 't(\'teacherClasses.')
);
replaceInFile('src/pages/Classes.tsx', content => 
    content.replace(/t\(['"]classes\./g, 't(\'adminClasses.')
);
replaceInFile('src/pages/TeacherAssignments.tsx', content => 
    content.replace(/t\(['"]assignments\./g, 't(\'teacherAssignments.')
);
replaceInFile('src/pages/StudentAssignments.tsx', content => 
    content.replace(/t\(['"]assignments\./g, 't(\'studentAssignments.')
);

console.log('Renaming completed.');
