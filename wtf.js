document.addEventListener("DOMContentLoaded", () => {
    // Тема
    const themeToggle = document.createElement("button");
    themeToggle.textContent = "Темная тема";
    themeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        themeToggle.textContent = isDark ? "Светлая тема" : "Темная тема";
    });
    document.body.prepend(themeToggle);
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "Светлая тема";
    }

    // Модальные окна
    const modal = document.getElementById("edit-modal");
    const editTitle = document.getElementById("edit-title");
    const editDescription = document.getElementById("edit-description");
    const editPriority = document.getElementById("edit-priority");
    const editDate = document.getElementById("edit-date");
    const saveEditBtn = document.getElementById("save-edit");
    const cancelEditBtn = document.getElementById("cancel-edit");
    let editingIndex = null;

    const deleteModal = document.getElementById("delete-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete");
    const cancelDeleteBtn = document.getElementById("cancel-delete");
    let deleteIndex = null;

    const completeModal = document.getElementById("complete-modal");
    const confirmCompleteBtn = document.getElementById("confirm-complete");
    const cancelCompleteBtn = document.getElementById("cancel-complete");
    let completeIndex = null;

    const alertModal = document.getElementById("alert-modal");
    const alertMessage = document.getElementById("alert-message");
    const alertOkBtn = document.getElementById("alert-ok");

    // Основные элементы
    const taskForm = document.getElementById("task-form");
    const taskList = document.getElementById("task-list");
    const filterOptions = document.getElementById("filter-options");

    // Сортировка
    document.getElementById("sort-priority").addEventListener("click", () => sortTasks("priority"));
    document.getElementById("sort-date").addEventListener("click", () => sortTasks("date"));
    document.getElementById("sort-name").addEventListener("click", () => sortTasks("name"));

    const priorityWeights = { "Высокий": 3, "Средний": 2, "Низкий": 1 };
    let currentSort = null;

    function sortTasks(criteria, animatedTask = null) {
        currentSort = criteria;
        localStorage.setItem("sortCriteria", criteria);
        if (criteria === "priority") {
            tasks.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
        } else if (criteria === "date") {
            tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        } else if (criteria === "name") {
            tasks.sort((a, b) => a.title.localeCompare(b.title));
        }
    
        renderTasks(filterOptions.value, animatedTask);
    }
    

    // Задачи
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    // Ошибка
    function showAlert(message) {
        alertMessage.textContent = message;
        alertModal.classList.remove("hidden");
    } 

    // Отображение колонок
    let currentColumnCount = 4;
    const layoutButtons = document.querySelectorAll("#layout-buttons button");
    layoutButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            layoutButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentColumnCount = parseInt(btn.getAttribute("data-columns"));
            taskList.style.gridTemplateColumns = `repeat(${currentColumnCount}, minmax(0, 1fr))`;
            localStorage.setItem("columnCount", currentColumnCount);
        });
    });

    const savedColumnCount = localStorage.getItem("columnCount");
    if (savedColumnCount) {
    currentColumnCount = parseInt(savedColumnCount);
    taskList.style.gridTemplateColumns = `repeat(${currentColumnCount}, minmax(0, 1fr))`;
    layoutButtons.forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-columns") === savedColumnCount);
    });
    }

    // Рендер
    function formatDate(isoString) {
        const date = new Date(isoString);
        if (isNaN(date)) return "неизвестно";
    
        return date.toLocaleString("ru-RU", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }
    
    function renderTasks(filter = "all", animateIndex = null) {
        taskList.innerHTML = "";
    
        tasks.forEach((task, index) => {
            if (filter !== "all" && task.status !== filter) return;
    
            const taskItem = document.createElement("div");
            taskItem.classList.add("task-item");
            taskItem.setAttribute("data-index", index);

            if (task.id == animateIndex) {
                requestAnimationFrame(() => {
                    taskItem.classList.add("animate-in");
                });
            }
    
            const completeButton = task.status !== "Завершено✔️"
            ? `<button class="complete-btn" data-index="${index}">✅</button>`
            : "";

            taskItem.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <div class="task-bottom">
                <span>Приоритет: ${task.priority}</span>
                <span>Срок: ${formatDate(task.dueDate)}</span>
                <span>Статус: ${task.status}</span>
                <div class="task-buttons">
                    ${completeButton}
                    <button class="edit-btn" data-index="${index}">✏️</button>
                    <button class="delete-btn" data-index="${index}">❌</button>
                </div>
            </div>
            `;
    
            taskList.appendChild(taskItem);
    
            if (index === animateIndex) {
                requestAnimationFrame(() => {
                    taskItem.classList.add("animate-in");
                });
            }
        });
    
        taskList.style.gridTemplateColumns = `repeat(${currentColumnCount}, minmax(0, 1fr))`;
    }

    // Добавление задачи
    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const priority = document.getElementById("priority").value;
        const dueDate = document.getElementById("due-date").value;
        

        if (!title || new Date(dueDate) < new Date()) {
            showAlert("Название обязательно, а срок выполнения должен быть в будущем.");
            return;
        }

        const newTask = { id: Date.now(), title, description, priority, dueDate, status: "В процессе⏳" };
        tasks.push(newTask);
        saveTasks();
        if (currentSort) {
            sortTasks(currentSort, newTask.id);
        } else {
            renderTasks(filterOptions.value, newTask.id);
        }
        // renderTasks(filterOptions.value, tasks.length - 1);
        taskForm.reset();
    });

    // Обработка кликов по задачам
    taskList.addEventListener("click", (event) => {
        const index = event.target.dataset.index;
        if (!index) return;

        if (event.target.classList.contains("complete-btn")) {
            completeIndex = index;
            completeModal.classList.remove("hidden");
        } else if (event.target.classList.contains("delete-btn")) {
            deleteIndex = index;
            deleteModal.classList.remove("hidden");
        } else if (event.target.classList.contains("edit-btn")) {
            const task = tasks[index];
            editingIndex = index;
            editTitle.value = task.title;
            editDescription.value = task.description;
            editPriority.value = task.priority;
            editDate.value = task.dueDate;
            modal.classList.remove("hidden");
        }
    });

    // Кнопки модального окна

    // Кнопка редактирования
    saveEditBtn.addEventListener("click", () => {
        const title = editTitle.value;
        const description = editDescription.value;
        const priority = editPriority.value;
        const dueDate = editDate.value;

        if (!title || new Date(dueDate) < new Date()) {
            showAlert("Название обязательно, а срок выполнения должен быть в будущем.");
            return;
        }

        tasks[editingIndex] = {
            ...tasks[editingIndex],
            title,
            description,
            priority,
            dueDate
        };

        saveTasks();
        renderTasks(filterOptions.value);
        modal.classList.add("hidden");
    });

    cancelEditBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    // Кнопка удаления
    confirmDeleteBtn.addEventListener("click", () => {
        if (deleteIndex !== null) {
            const taskItem = document.querySelector(`.task-item[data-index="${deleteIndex}"]`);
            if (taskItem) {
                taskItem.classList.add("animate-out");
                taskItem.addEventListener("animationend", () => {
                    tasks.splice(deleteIndex, 1);
                    saveTasks();
                    renderTasks(filterOptions.value);
                    deleteModal.classList.add("hidden");
                    deleteIndex = null;
                }, { once: true });
            } else {
                tasks.splice(deleteIndex, 1);
                saveTasks();
                renderTasks(filterOptions.value, null);
                deleteModal.classList.add("hidden");
                deleteIndex = null;
            }
        }
    });
    
    
    cancelDeleteBtn.addEventListener("click", () => {
        deleteModal.classList.add("hidden");
        deleteIndex = null;
    });

    // Кнопка завершения
    confirmCompleteBtn.addEventListener("click", () => {
        if (completeIndex !== null) {
            tasks[completeIndex].status = "Завершено✔️";
            saveTasks();
            renderTasks();
            completeModal.classList.add("hidden");
            completeIndex = null;
        }
    })

    cancelCompleteBtn.addEventListener("click", () => {
        completeModal.classList.add("hidden");
        completeIndex = null;
    })
    
    // Кнопка ошибки
    alertOkBtn.addEventListener("click", () => {
        alertModal.classList.add("hidden");
    });      

    // Фильтрация
    filterOptions.addEventListener("change", (event) => {
        localStorage.setItem("currentFilter", event.target.value);
        renderTasks(event.target.value);
    });

    const savedFilter = localStorage.getItem("currentFilter");
    if (savedFilter) {
        filterOptions.value = savedFilter;
    }

    const savedSort = localStorage.getItem("sortCriteria");
    if (savedSort) {
        sortTasks(savedSort, false);
        
        // Пометим активную кнопку сортировки
        document.querySelectorAll('.sort-buttons button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === `sort-${savedSort}`) {
                btn.classList.add('active');
            }
        });
    }

    renderTasks(filterOptions.value);
});