document.addEventListener('DOMContentLoaded', () => {
    const taskCourse = document.getElementById('taskCourse');
    const taskType = document.getElementById('taskType');
    const taskDescription = document.getElementById('taskDescription');
    const taskFile = document.getElementById('taskFile'); // input multiple
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    const scheduleTable = document.getElementById('scheduleTable');
    const scheduleCells = document.querySelectorAll('#scheduleTable td[contenteditable="true"]');

    // ------------------------ Fecha ------------------------
    const dateContainer = document.getElementById('dateContainer');
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = localStorage.getItem('selectedDate') || new Date().toISOString().substr(0,10);
    dateContainer.appendChild(dateInput);

    function getDateKey(date) {
        return new Date(date).toISOString().substr(0,10);
    }

    let currentDateKey = getDateKey(dateInput.value);

    dateInput.addEventListener('change', () => {
        localStorage.setItem('selectedDate', dateInput.value);
        currentDateKey = getDateKey(dateInput.value);
        loadTasksByDate();
    });

    // ------------------------ Guardar/Cargar horario ------------------------
    let dayStatus = JSON.parse(localStorage.getItem('dayStatus') || '{}');

    function saveSchedule() {
        const scheduleData = Array.from(scheduleCells).map(c => c.innerText);
        localStorage.setItem('schedule', JSON.stringify(scheduleData));
        localStorage.setItem('dayStatus', JSON.stringify(dayStatus));
        updateCourses();
        updateDayColors();
    }

    function loadSchedule() {
        const scheduleData = JSON.parse(localStorage.getItem('schedule') || '[]');
        if(scheduleData.length === scheduleCells.length)
            scheduleCells.forEach((c,i)=>c.innerText=scheduleData[i]);
        updateCourses();
        updateDayColors();
    }

    scheduleCells.forEach(c => c.addEventListener('input', saveSchedule));

    // ------------------------ Cursos dinámicos ------------------------
    const cursos = new Set();
    function updateCourses() {
        cursos.clear();
        scheduleCells.forEach(c => c.innerText.split('/').forEach(s => { if(s.trim()) cursos.add(s.trim()); }));
        taskCourse.innerHTML = '';
        cursos.forEach(c => {
            const option = document.createElement('option');
            option.value = option.innerText = c;
            taskCourse.appendChild(option);
        });
    }

    // ------------------------ Días libres / vacaciones ------------------------
    const dayHeaders = scheduleTable.querySelectorAll('th');
    dayHeaders.forEach((th, index) => {
        if(index === 0) return;
        const select = document.createElement('select');
        select.innerHTML = `<option value="">Normal</option><option value="Libre">Día libre</option><option value="Vacaciones">Vacaciones</option>`;
        th.appendChild(document.createElement('br'));
        th.appendChild(select);
        if(dayStatus[index]) select.value = dayStatus[index];

        select.addEventListener('change', ()=> {
            dayStatus[index] = select.value;
            saveSchedule();
        });
    });

    function updateDayColors() {
        const rows = scheduleTable.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell,i) => {
                if(i===0) return;
                const status = dayStatus[i] || '';
                if(status==='Libre' || status==='Vacaciones') cell.style.backgroundColor = '#98fb98';
                else if(cell.innerText.trim().toLowerCase()==='recreo') cell.style.backgroundColor = '#7CFC00';
                else cell.style.backgroundColor = '';
            });
        });
    }

    // ------------------------ Tareas ------------------------
    addTaskBtn.addEventListener('click', ()=>{
        const course = taskCourse.value, type = taskType.value, desc = taskDescription.value.trim();
        const files = Array.from(taskFile.files); // múltiples archivos
        if(course && type && desc) { 
            if(files.length > 0){
                let loadedFiles = [];
                let processed = 0;
                files.forEach(f => {
                    const reader = new FileReader();
                    reader.onload = function(e){
                        loadedFiles.push({data: e.target.result, name: f.name});
                        processed++;
                        if(processed === files.length){
                            addTask(course,type,desc,false,loadedFiles);
                            saveTasksByDate();
                        }
                    };
                    reader.readAsDataURL(f);
                });
            } else {
                addTask(course,type,desc,false);
                saveTasksByDate();
            }
            taskDescription.value='';
            taskFile.value='';
        } else alert('Completa todos los campos antes de agregar.');
    });

    function addTask(course,type,desc,done,files=[]){
        const li=document.createElement('li');
        let fileHTML = '';
        if(files.length > 0){
            fileHTML = '<br>' + files.map(f => `<a href="${f.data}" download="${f.name}" target="_blank">📎 ${f.name}</a>`).join('<br>');
        }
        li.innerHTML=`<span>[${course}] (${type}) ${desc}${fileHTML}</span>
                      <div><button class="doneBtn">Hecho</button>
                      <button class="deleteBtn">Borrar</button></div>`;
        if(done) li.classList.add('done');
        taskList.appendChild(li);
        li.querySelector('.doneBtn').addEventListener('click',()=>{li.classList.toggle('done'); saveTasksByDate();});
        li.querySelector('.deleteBtn').addEventListener('click',()=>{li.remove(); saveTasksByDate();});
    }

    function saveTasksByDate(){
        const allTasks = Array.from(taskList.querySelectorAll('li')).map(li=>{
            const span=li.querySelector('span');
            const match=span.innerText.match(/\[(.*?)\] \((.*?)\) ([\s\S]*)/);
            const fileLinks = Array.from(span.querySelectorAll('a')).map(a=>({data: a.href, name: a.innerText.replace('📎 ','')}));
            return {course:match[1],type:match[2],desc:match[3],done:li.classList.contains('done'), files: fileLinks};
        });
        const tasksByDate = JSON.parse(localStorage.getItem('tasksByDate') || '{}');
        tasksByDate[currentDateKey] = allTasks;
        localStorage.setItem('tasksByDate', JSON.stringify(tasksByDate));
        renderCourseCategories();
    }

    function loadTasksByDate(){
        taskList.innerHTML = '';
        const tasksByDate = JSON.parse(localStorage.getItem('tasksByDate') || '{}');
        const savedTasks = tasksByDate[currentDateKey] || [];
        savedTasks.forEach(t => addTask(t.course,t.type,t.desc,t.done,t.files));
        renderCourseCategories();
    }

    function renderCourseCategories(){
        let container=document.getElementById('coursesContainer');
        if(!container){
            container=document.createElement('div'); 
            container.id='coursesContainer';
            document.querySelector('.tasks-section').appendChild(container);
        }
        container.innerHTML='';
        const tasksByDate = JSON.parse(localStorage.getItem('tasksByDate') || '{}');
        const savedTasks = tasksByDate[currentDateKey] || [];
        const grouped={};
        savedTasks.forEach(t=>{if(!grouped[t.course])grouped[t.course]=[];grouped[t.course].push(`${t.type}: ${t.desc}`);});
        for(const c in grouped){
            const div=document.createElement('div'); div.classList.add('course-category');
            div.innerHTML=`<h3>${c}</h3><ul>${grouped[c].map(d=>`<li>${d}</li>`).join('')}</ul>`;
            container.appendChild(div);
        }
    }

    loadSchedule();
    loadTasksByDate();

    // ------------------------ Fondo animado ------------------------
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const particles = [];
    const colors = ['#ff6ec7','#00ffff','#ffdd00','#ff4ab8','#00ff99'];
    for(let i=0; i<80; i++){
        particles.push({ x: Math.random()*width, y: Math.random()*height, r: Math.random()*3+1, dx: (Math.random()-0.5)*1.5, dy: (Math.random()-0.5)*1.5, color: colors[Math.floor(Math.random()*colors.length)] });
    }

    function animate(){
        ctx.clearRect(0,0,width,height);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fillStyle = p.color;
            ctx.fill();
            p.x += p.dx; p.y += p.dy;
            if(p.x<0 || p.x>width) p.dx*=-1;
            if(p.y<0 || p.y>height) p.dy*=-1;
        });
        requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener('resize', ()=>{ width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });
});
