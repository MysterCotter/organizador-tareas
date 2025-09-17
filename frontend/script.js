// --------------------
// Select dinámico de categoría y grado
// --------------------
const categorySelect = document.getElementById('category');
const gradeSelect = document.getElementById('grade');

const grados = {
    primaria: ["1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria"],
    secundaria: ["1° Secundaria", "2° Secundaria", "3° Secundaria", "4° Secundaria", "5° Secundaria"],
    universidad: ["1° Año", "2° Año", "3° Año", "4° Año", "5° Año"]
};

if(categorySelect){
    categorySelect.addEventListener('change', () => {
        const cat = categorySelect.value;
        gradeSelect.innerHTML = '<option value="">Selecciona grado</option>';
        if(grados[cat]){
            grados[cat].forEach(g => {
                const option = document.createElement('option');
                option.value = g;
                option.text = g;
                gradeSelect.appendChild(option);
            });
        }
    });
}

// --------------------
// Validación y check de confirmación al rellenar
// --------------------
const inputs = document.querySelectorAll('input, select');

inputs.forEach(input => {
    input.addEventListener('input', () => {
        if(input.value.trim() !== ''){
            input.classList.add('valid'); // mostrar check y borde verde
        } else {
            input.classList.remove('valid'); // quitar check si está vacío
        }
    });
});

// --------------------
// Registro
// --------------------
const registerForm = document.getElementById('registerForm');

if(registerForm){
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const age = document.getElementById('age').value;
        const category = document.getElementById('category').value;
        const grade = document.getElementById('grade').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if(name && age && category && grade && email && password){
            // Guardar info en localStorage
            localStorage.setItem('userName', name);
            localStorage.setItem('userAge', age);
            localStorage.setItem('userCategory', category);
            localStorage.setItem('userGrade', grade);
            localStorage.setItem('userEmail', email);

            // Redirigir según categoría
            if(category === 'primaria' || category === 'secundaria'){
                window.location.href = 'panel.html'; // Panel que ya tenemos
            } else if(category === 'universidad'){
                window.location.href = 'panel_uni.html'; // Panel universidad
            }
        } else {
            alert('Completa todos los campos.');
        }
    });
}

// --------------------
// Login
// --------------------
const loginForm = document.getElementById('loginForm');

if(loginForm){
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if(email && password){
            alert('Inicio de sesión exitoso. Serás llevado al panel.');
            // Redirigir según categoría guardada
            const category = localStorage.getItem('userCategory');
            if(category === 'primaria' || category === 'secundaria'){
                window.location.href = 'panel.html';
            } else if(category === 'universidad'){
                window.location.href = 'panel_uni.html';
            }
        } else {
            alert('Completa todos los campos.');
        }
    });
}

// --------------------
// Animación del contenedor al cargar
// --------------------
window.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    if(container){
        container.style.opacity = '0';
        container.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            container.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
});

// --------------------
// Panel Principal (Horario y Tareas) - solo se activa si hay elementos de panel
// --------------------
document.addEventListener('DOMContentLoaded', () => {
    const taskCourse = document.getElementById('taskCourse');
    const taskType = document.getElementById('taskType');
    const taskDescription = document.getElementById('taskDescription');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    if(!taskCourse) return; // Si no hay panel, salir

    // Llenar select de cursos según el horario
    const scheduleCells = document.querySelectorAll('#scheduleTable td[contenteditable="true"]');
    const cursos = new Set();
    scheduleCells.forEach(cell => {
        if(cell.innerText.trim() !== '') cursos.add(cell.innerText.trim());
    });

    // Función para actualizar cursos dinámicamente
    function updateCourses() {
        const options = ['<option value="">Selecciona curso</option>'];
        cursos.forEach(c => options.push(`<option value="${c}">${c}</option>`));
        taskCourse.innerHTML = options.join('');
    }

    updateCourses();

    // Agregar tarea/evento
    addTaskBtn.addEventListener('click', () => {
        const course = taskCourse.value;
        const type = taskType.value;
        const desc = taskDescription.value.trim();

        if(course && type && desc){
            const li = document.createElement('li');
            li.innerHTML = `<span>[${course}] (${type}) ${desc}</span> <button class="doneBtn">Hecho</button>`;
            taskList.appendChild(li);
            taskDescription.value = '';

            // marcar como hecho
            li.querySelector('.doneBtn').addEventListener('click', () => {
                li.classList.toggle('done');
            });

            saveTasks();
        } else {
            alert('Completa todos los campos antes de agregar.');
        }
    });

    // Actualizar cursos si se edita el horario
    scheduleCells.forEach(cell => {
        cell.addEventListener('input', () => {
            cursos.clear();
            scheduleCells.forEach(c => { if(c.innerText.trim() !== '') cursos.add(c.innerText.trim()); });
            updateCourses();
        });
    });

    // Guardar tareas en localStorage
    function saveTasks(){
        const allTasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            const [info, ] = li.innerText.split('Hecho');
            const match = info.match(/\[(.*?)\] \((.*?)\) (.*)/);
            if(match){
                allTasks.push({
                    course: match[1],
                    type: match[2],
                    desc: match[3],
                    done: li.classList.contains('done')
                });
            }
        });
        localStorage.setItem('tasks', JSON.stringify(allTasks));
    }

    // Cargar tareas de localStorage al iniciar
    if(localStorage.getItem('tasks')){
        const savedTasks = JSON.parse(localStorage.getItem('tasks'));
        savedTasks.forEach(t => {
            const li = document.createElement('li');
            li.innerHTML = `<span>[${t.course}] (${t.type}) ${t.desc}</span> <button class="doneBtn">Hecho</button>`;
            if(t.done) li.classList.add('done');
            taskList.appendChild(li);

            li.querySelector('.doneBtn').addEventListener('click', () => {
                li.classList.toggle('done');
                saveTasks();
            });
        });
    }
});
