// const FIRSTNAMES = [
//     "Lacey", "Colette", "Waylon", "Shaniah", "Heidi", "Harley", "Stephanie", "Yahir", 
//     "Leif", "Micah", "Marcellus", "Daxton", "Macie", "Norah", "Ryleigh", "Kenzie", 
//     "Salem", "Blaine", "Julius", "Sterling", "Alfredo", "Yehuda", "Annika", "Morgan",
//     "Madeleine", "Bradley", "Grayson", "Amirah", "Margot", "Santino", "Braylon"
// ];

// const LASTNAMES = [
//     "Valencia", "Todd", "Payne", "McMahon", "Moss", "Moody", "Walters", "Brooks", 
//     "Townsend", "Crane", "Olsen", "Espinoza", "Wiggins", "Nunez", "Blackwell", "Hudson",
//     "McClure", "Beasley", "Sanford", "McCoy", "McCarthy", "Murphy", "Correa", "Reilly"
// ];

const COURSES_BY_STAGE = {
    "1": ["Maths", "Anglais", "Francais"],
    "2": ["Info", "SD", "Maths A."],
    "3": ["BD", "Programmation", "Stats"],
    "4": ["SGBD", "Programmation A.", "Stats A."]
};

let students = [];
let chartStages = null;
let chartCourses = null;

function randomGauss(mean = 75, stdev = 8) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    let val = mean + num * stdev;
    return Math.min(100, Math.max(40, parseFloat(val.toFixed(2))));
}

/* function generateInitialStudents(count = 24) {
    const list = [];
    let startId = 300000;

    for (let i = 0; i < count; i++) {
        const currentStage = Math.floor(Math.random() * 4) + 1;
        const history = {};

        for (let s = 1; s <= currentStage; s++) {
            const stageCourses = COURSES_BY_STAGE[s];
            const stageGrades = {};
            stageCourses.forEach(course => {
                stageGrades[course] = randomGauss();
            });
            history[s] = stageGrades;
        }

        const student = {
            id: startId + i,
            firstname: FIRSTNAMES[Math.floor(Math.random() * FIRSTNAMES.length)],
            lastname: LASTNAMES[Math.floor(Math.random() * LASTNAMES.length)],
            currentStage: currentStage,
            history: history
        };

        list.push(student);
    }
    return list;
} */

function getStageAverage(student, stage) {
    const gradesObj = student.history[stage];
    if (!gradesObj) return 0;
    const values = Object.values(gradesObj);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return parseFloat((sum / values.length).toFixed(2));
}

function getOverallAverage(student) {
    let totalSum = 0;
    let totalCount = 0;
    Object.values(student.history).forEach(stageGrades => {
        Object.values(stageGrades).forEach(grade => {
            totalSum += grade;
            totalCount++;
        });
    });
    return totalCount ? parseFloat((totalSum / totalCount).toFixed(2)) : 0;
}

window.onload = async function() {
    lucide.createIcons();
    try {
        const response = await fetch('etudiants.json');
        if (response.ok) {
            students = await response.json();
            console.log("Données chargées depuis etudiants.json :", students);
        } else {
            throw new Error("Fichier JSON non trouvé");
        }
    } catch (error) {
        console.warn("Impossible de charger etudiants.json, utilisation des données locales :", error);
        const stored = localStorage.getItem('academix_students');
        if (stored) students = JSON.parse(stored);
    }

    renderDashboard();
    renderStudentsTable();
    renderCoursesCatalog();
    renderGraduatesTable();
};

function saveData() {
    localStorage.setItem('academix_students', JSON.stringify(students));
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('bg-brand-600', 'text-white');
        el.classList.add('text-slate-400');
    });

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`nav-${tabName}`);
    activeBtn.classList.add('bg-brand-600', 'text-white');
    activeBtn.classList.remove('text-slate-400');

    if (tabName === 'dashboard') renderDashboard();
    if (tabName === 'students') renderStudentsTable();
    if (tabName === 'courses') renderCoursesCatalog();
    if (tabName === 'actions') renderGraduatesTable();
}

function renderDashboard() {
    const filterStage = document.getElementById('dash-stage-filter').value;
    let filteredStudents = students;

    if (filterStage !== 'all') {
        filteredStudents = students.filter(s => s.currentStage === parseInt(filterStage));
    }

    const totalCount = filteredStudents.length;
    document.getElementById('kpi-total-students').innerText = totalCount;

    let grandSum = 0;
    let passingCount = 0;

    filteredStudents.forEach(s => {
        const avg = getOverallAverage(s);
        grandSum += avg;
        if (avg >= 65) passingCount++;
    });

    const globalAvg = totalCount ? (grandSum / totalCount).toFixed(1) : "0.0";
    const passRate = totalCount ? Math.round((passingCount / totalCount) * 100) : 0;

    document.getElementById('kpi-avg-score').innerText = `${globalAvg}%`;
    document.getElementById('kpi-pass-rate').innerText = `${passRate}%`;

    const stageCounts = {1: 0, 2: 0, 3: 0, 4: 0};
    students.forEach(s => stageCounts[s.currentStage]++);

    let topStage = "1";
    let maxC = 0;
    for (let st in stageCounts) {
        if (stageCounts[st] > maxC) {
            maxC = stageCounts[st];
            topStage = st;
        }
    }
    document.getElementById('kpi-top-stage').innerText = `Étape ${topStage}`;

    renderCharts(stageCounts);
}

function renderCharts(stageCounts) {
    const ctxStage = document.getElementById('chart-stages').getContext('2d');
    if (chartStages) chartStages.destroy();

    chartStages = new Chart(ctxStage, {
        type: 'doughnut',
        data: {
            labels: ['Étape 1', 'Étape 2', 'Étape 3', 'Étape 4'],
            datasets: [{
                data: [stageCounts[1], stageCounts[2], stageCounts[3], stageCounts[4]],
                backgroundColor: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            }
        }
    });

    const courseStats = {};
    Object.values(COURSES_BY_STAGE).flat().forEach(c => courseStats[c] = { sum: 0, count: 0 });

    students.forEach(s => {
        Object.values(s.history).forEach(stageGrades => {
            Object.entries(stageGrades).forEach(([course, grade]) => {
                if (courseStats[course]) {
                    courseStats[course].sum += grade;
                    courseStats[course].count++;
                }
            });
        });
    });

    const courseLabels = Object.keys(courseStats);
    const courseAverages = courseLabels.map(c => 
        courseStats[c].count ? (courseStats[c].sum / courseStats[c].count).toFixed(1) : 0
    );

    const ctxCourses = document.getElementById('chart-courses').getContext('2d');
    if (chartCourses) chartCourses.destroy();

    chartCourses = new Chart(ctxCourses, {
        type: 'bar',
        data: {
            labels: courseLabels,
            datasets: [{
                label: 'Moyenne (%)',
                data: courseAverages,
                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                borderColor: '#6366f1',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderStudentsTable() {
    const search = document.getElementById('student-search').value.toLowerCase();
    const stageFilter = document.getElementById('filter-stage').value;
    const statusFilter = document.getElementById('filter-status').value;

    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';

    const filtered = students.filter(s => {
        const fullName = `${s.firstname} ${s.lastname}`.toLowerCase();
        const matchesSearch = fullName.includes(search) || s.id.toString().includes(search);
        const matchesStage = stageFilter === 'all' || s.currentStage === parseInt(stageFilter);

        const avg = getOverallAverage(s);
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'pass' && avg >= 65) || 
                             (statusFilter === 'fail' && avg < 65);

        return matchesSearch && matchesStage && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500">Aucun étudiant trouvé.</td></tr>`;
        return;
    }

    filtered.forEach(s => {
        const avg = getOverallAverage(s);
        const isPass = avg >= 65;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition-colors";
        tr.innerHTML = `
            <td class="p-4 font-mono text-xs text-slate-400">#${s.id}</td>
            <td class="p-4 font-medium text-white">${s.firstname} ${s.lastname}</td>
            <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">Étape ${s.currentStage}</span></td>
            <td class="p-4 font-bold ${isPass ? 'text-emerald-400' : 'text-rose-400'}">${avg}%</td>
            <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isPass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
                    <span class="w-1.5 h-1.5 rounded-full ${isPass ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
                    ${isPass ? 'Admissible (≥65%)' : 'Ajourné (<65%)'}
                </span>
            </td>
            <td class="p-4 text-right space-x-2">
                <button onclick="openDossier(${s.id})" class="text-xs bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white px-3 py-1.5 rounded-lg border border-brand-500/30 transition-colors">
                    Voir Dossier
                </button>
                <button onclick="deleteStudent(${s.id})" class="text-xs bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white p-1.5 rounded-lg border border-rose-500/20 transition-colors">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

function openDossier(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    document.getElementById('dossier-name').innerText = `${student.firstname} ${student.lastname}`;
    document.getElementById('dossier-id').innerText = `ID: #${student.id} • Inscrit au Collège`;
    document.getElementById('dossier-avatar').innerText = `${student.firstname[0]}${student.lastname[0]}`;
    document.getElementById('dossier-stage').innerText = `Étape ${student.currentStage}`;

    const overallAvg = getOverallAverage(student);
    document.getElementById('dossier-avg').innerText = `${overallAvg}%`;
    
    const isPass = overallAvg >= 65;
    const statusEl = document.getElementById('dossier-status');
    statusEl.innerText = isPass ? "Éligible Passage" : "À Renforcer";
    statusEl.className = `text-xl font-bold mt-1 ${isPass ? 'text-emerald-400' : 'text-rose-400'}`;

    const historyContainer = document.getElementById('dossier-history');
    historyContainer.innerHTML = '';

    for (let st = 1; st <= student.currentStage; st++) {
        const stageGrades = student.history[st];
        const stageAvg = getStageAverage(student, st);
        
        const card = document.createElement('div');
        card.className = "bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3";

        let rowsHtml = '';
        if (stageGrades) {
            Object.entries(stageGrades).forEach(([course, grade]) => {
                rowsHtml += `
                    <div class="flex items-center justify-between py-1 border-b border-slate-700/30 last:border-0 text-sm">
                        <span class="text-slate-300">${course}</span>
                        <span class="font-semibold ${grade >= 65 ? 'text-slate-200' : 'text-rose-400'}">${grade}%</span>
                    </div>
                `;
            });
        }

        card.innerHTML = `
            <div class="flex items-center justify-between pb-2 border-b border-slate-700">
                <span class="text-xs font-bold text-brand-400 uppercase tracking-wider">Étape ${st} ${st === student.currentStage ? '(En cours)' : '(Terminée)'}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-200">Moyenne Étape: <strong>${stageAvg}%</strong></span>
            </div>
            <div class="space-y-1">
                ${rowsHtml}
            </div>
        `;
        historyContainer.appendChild(card);
    }

    openModal('dossier-modal');
}

function renderCoursesCatalog() {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = '';

    Object.entries(COURSES_BY_STAGE).forEach(([stage, courses]) => {
        const card = document.createElement('div');
        card.className = "bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4";
        
        let courseButtons = '';
        courses.forEach(c => {
            courseButtons += `
                <button onclick="selectCourse('${c}', '${stage}')" class="w-full text-left p-3 rounded-lg bg-slate-800/60 hover:bg-brand-600/20 hover:border-brand-500/40 border border-slate-700/50 transition-all flex items-center justify-between group">
                    <span class="text-sm font-medium text-slate-200 group-hover:text-brand-300">${c}</span>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500 group-hover:text-brand-400"></i>
                </button>
            `;
        });

        card.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 class="font-bold text-white">Étape ${stage}</h3>
                <span class="text-xs text-slate-500">${courses.length} Matières</span>
            </div>
            <div class="space-y-2">
                ${courseButtons}
            </div>
        `;
        grid.appendChild(card);
    });

    lucide.createIcons();
}

function selectCourse(courseName, stage) {
    const panel = document.getElementById('course-students-panel');
    const title = document.getElementById('selected-course-title');
    const badge = document.getElementById('selected-course-badge');
    const tbody = document.getElementById('course-students-body');

    title.innerText = `Étudiants inscrits en ${courseName}`;
    badge.innerText = `Étape ${stage}`;
    tbody.innerHTML = '';

    const enrolled = [];
    students.forEach(s => {
        if (s.history[stage] && s.history[stage][courseName] !== undefined) {
            enrolled.push({
                student: s,
                grade: s.history[stage][courseName]
            });
        }
    });

    if (enrolled.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500">Aucun étudiant inscrit à ce cours pour le moment.</td></tr>`;
    } else {
        enrolled.forEach(item => {
            const isPass = item.grade >= 65;
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-800/30";
            tr.innerHTML = `
                <td class="py-3 px-4 font-mono text-xs text-slate-400">#${item.student.id}</td>
                <td class="py-3 px-4 font-medium text-white">${item.student.firstname} ${item.student.lastname}</td>
                <td class="py-3 px-4 font-bold ${isPass ? 'text-emerald-400' : 'text-rose-400'}">${item.grade}%</td>
                <td class="py-3 px-4">
                    <span class="text-xs px-2 py-0.5 rounded ${isPass ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                        ${isPass ? 'Réussi' : 'Échec'}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth' });
}

function closeCoursePanel() {
    document.getElementById('course-students-panel').classList.add('hidden');
}

function handleRegisterStudent(e) {
    e.preventDefault();
    const firstname = document.getElementById('reg-firstname').value.trim();
    const lastname = document.getElementById('reg-lastname').value.trim();
    const stage = parseInt(document.getElementById('reg-stage').value);

    if (!firstname || !lastname) return;

    const nextId = students.length ? Math.max(...students.map(s => s.id)) + 1 : 300000;
    const history = {};

    for (let s = 1; s <= stage; s++) {
        const stageGrades = {};
        COURSES_BY_STAGE[s].forEach(c => stageGrades[c] = randomGauss());
        history[s] = stageGrades;
    }

    const newStudent = {
        id: nextId,
        firstname: firstname,
        lastname: lastname,
        currentStage: stage,
        history: history
    };

    students.unshift(newStudent);
    saveData();
    closeModal('register-modal');
    renderStudentsTable();
    document.getElementById('register-form').reset();
}

function executeSemesterPassage() {
    let promotedCount = 0;

    students.forEach(s => {
        const currentAvg = getStageAverage(s, s.currentStage);
        if (currentAvg >= 65 && s.currentStage < 4) {
            s.currentStage += 1;
            promotedCount++;
            
            const newStageGrades = {};
            COURSES_BY_STAGE[s.currentStage].forEach(c => newStageGrades[c] = 0.0);
            s.history[s.currentStage] = newStageGrades;
        }
    });

    saveData();
    renderDashboard();
    renderStudentsTable();
    renderGraduatesTable();
    alert(`Simulation de passage de semestre terminée !\n${promotedCount} étudiant(s) promu(s) à l'étape supérieure (notes initialisées à 0).`);
}

function deleteStudent(studentId) {
    students = students.filter(s => s.id !== studentId);
    saveData();
    renderStudentsTable();
    renderDashboard();
    renderGraduatesTable();
}

function resetData() {
    students = generateInitialStudents(24);
    saveData();
    renderDashboard();
    renderStudentsTable();
    renderCoursesCatalog();
    renderGraduatesTable();
    alert("La base de données a été réinitialisée avec succès !");
}

// GESTION DES DIPLÔMES ET ÉTUDIANTS DE NIVEAU 4 ÉLIGIBLES
function renderGraduatesTable() {
    const tbody = document.getElementById('listeGraduesBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Filtrer les étudiants de l'étape 4 avec moyenne >= 65%
    const gradues = students.filter(s => s.currentStage === 4 && getStageAverage(s, 4) >= 65);

    if (gradues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-slate-500">Aucun étudiant de l'Étape 4 éligible pour le moment.</td></tr>`;
        return;
    }

    gradues.forEach(s => {
        const moyenneFinale = getStageAverage(s, 4);
        const tr = document.createElement('tr');
        tr.id = `row-${s.id}`;
        tr.className = "hover:bg-slate-800/30";
        tr.innerHTML = `
            <td class="py-3 px-4 font-mono text-xs text-slate-400">#${s.id}</td>
            <td class="py-3 px-4 font-medium text-white">${s.firstname} ${s.lastname}</td>
            <td class="py-3 px-4 font-bold text-emerald-400">${moyenneFinale}%</td>
            <td class="py-3 px-4 text-right">
                <button onclick="telechargerDiplome('${s.id}', '${s.firstname}', '${s.lastname}')" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ml-auto">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i> Télécharger le Diplôme
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

function telechargerDiplome(numEtudiant, prenom, nom) {
    const dateJour = new Date().toISOString().slice(0, 10);
    const contenuDiplome = `=========================================\n` +
                           `       ACADEMY - DIPLÔME OFFICIEL        \n` +
                           `=========================================\n\n` +
                           `Certificat de fin d'études décerné à :\n\n` +
                           `  Nom & Prénom : ${nom} ${prenom}\n` +
                           `  Numéro ID    : ${numEtudiant}\n` +
                           `  Date         : ${dateJour}\n\n` +
                           `Félicitations pour l'obtention de votre diplôme !\n` +
                           `=========================================`;

    const blob = new Blob([contenuDiplome], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diplome_${nom}_${prenom}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    supprimerEtudiantDeLaBase(parseInt(numEtudiant));
}

function supprimerEtudiantDeLaBase(numEtudiant) {
    students = students.filter(s => s.id !== numEtudiant);
    saveData();
    renderGraduatesTable();
    renderStudentsTable();
    renderDashboard();
    alert("Diplôme téléchargé avec succès ! L'étudiant a été archivé et retiré de la base active.");
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}