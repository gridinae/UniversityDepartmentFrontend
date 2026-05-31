const API_BASE = "http://localhost:5233/api/v1";

let authToken = null;
let currentUser = null;

async function apiRequest(url, options = {}) {
    const fullUrl = `${API_BASE}${url}`;
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    const resp = await fetch(fullUrl, { ...options, headers });
    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`${resp.status}: ${errorText || resp.statusText}`);
    }
    if (resp.status === 204) return null;
    return resp.json();
}

function clearError(id) {
    const elem = document.getElementById(id);
    if (elem) elem.innerText = "";
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.style.display = "none");
}

document.getElementById("loginForm").onsubmit = async function (e) {
    e.preventDefault();
    clearError("loginError");
    const login = document.getElementById("login").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const resp = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, password }),
        });
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(text);
        }
        const data = await resp.json();
        authToken = data.token;

        document.getElementById("loginBlock").style.display = "none";
        document.getElementById("meBlock").style.display = "block";
        await loadCurrentUser();
    } catch (err) {
        document.getElementById("loginError").innerText = "Ошибка входа: " + err.message;
    }
};

async function loadCurrentUser() {
    try {
        currentUser = await apiRequest("/auth/me");
        const roleLabel = currentUser.role === 1 ? "Секретарь" : "Преподаватель";

        document.getElementById("role").innerText = roleLabel;

        if (currentUser.teacher) {
            document.getElementById("meName").innerText =
                `${currentUser.teacher.lastName || ""} ${currentUser.teacher.firstName || ""}`.trim();
        } else {
            document.getElementById("meName").innerText = "(без преподавателя)";
        }

        if (currentUser.role === 1) {
            document.getElementById("secretarySection").style.display = "block";
            document.getElementById("teacherSection").style.display = "none";
        } else {
            document.getElementById("secretarySection").style.display = "none";
            document.getElementById("teacherSection").style.display = "block";
            setTimeout(() => document.getElementById("showMyTeachingsBtn").click(), 100);
        }
    } catch (err) {
        document.getElementById("loginError").innerText = "Ошибка профиля: " + err.message;
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    document.getElementById("loginBlock").style.display = "block";
    document.getElementById("meBlock").style.display = "none";
    document.getElementById("classroomsBlock").style.display = "none";
    document.getElementById("teachersBlock").style.display = "none";
    document.getElementById("disciplinesBlock").style.display = "none";
    document.getElementById("teachingsBlock").style.display = "none";
    closeAllModals();
}
document.getElementById("logoutBtn").onclick = logout;

async function loadClassrooms() {
    clearError("classroomsError");
    try {
        const classrooms = await apiRequest("/classrooms");
        const tbody = document.querySelector("#classroomsTable tbody");
        tbody.innerHTML = "";
        for (let c of classrooms) {
            let row = tbody.insertRow();
            row.insertCell(0).innerText = c.id;
            row.insertCell(1).innerText = c.roomNumber;
            row.insertCell(2).innerText = c.building;
            row.insertCell(3).innerText = c.capacity || "-";

            let actionsCell = row.insertCell(4);
            let editBtn = document.createElement("button");
            editBtn.textContent = "✏️";
            editBtn.onclick = () => editClassroom(c.id);
            let deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑️";
            deleteBtn.onclick = () => deleteClassroom(c.id);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        }
    } catch (err) {
        document.getElementById("classroomsError").innerText = "Ошибка: " + err.message;
    }
}

async function editClassroom(id) {
    try {
        let classroom = await apiRequest(`/classrooms/${id}`);
        document.getElementById("editClassroomId").value = classroom.id;
        document.getElementById("editRoomNumber").value = classroom.roomNumber;
        document.getElementById("editBuilding").value = classroom.building;
        document.getElementById("editCapacity").value = classroom.capacity || "";
        document.getElementById("editClassroomModal").style.display = "block";
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
}

async function deleteClassroom(id) {
    if (!confirm("Точно удалить аудиторию?")) return;
    try {
        await apiRequest(`/classrooms/${id}`, { method: "DELETE" });
        await loadClassrooms();
    } catch (err) {
        alert("Ошибка удаления: " + err.message);
    }
}

document.getElementById("addClassroomBtn").onclick = () => {
    document.getElementById("addRoomNumber").value = "";
    document.getElementById("addBuilding").value = "";
    document.getElementById("addCapacity").value = "";
    document.getElementById("addClassroomModal").style.display = "block";
};

document.getElementById("saveAddClassroomBtn").onclick = async () => {
    let data = {
        roomNumber: document.getElementById("addRoomNumber").value,
        building: document.getElementById("addBuilding").value,
        capacity: parseInt(document.getElementById("addCapacity").value) || null
    };
    try {
        await apiRequest("/classrooms", { method: "POST", body: JSON.stringify(data) });
        document.getElementById("addClassroomModal").style.display = "none";
        await loadClassrooms();
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
};

document.getElementById("saveEditClassroomBtn").onclick = async () => {
    let id = parseInt(document.getElementById("editClassroomId").value);
    let data = {
        id: id,
        roomNumber: document.getElementById("editRoomNumber").value,
        building: document.getElementById("editBuilding").value,
        capacity: parseInt(document.getElementById("editCapacity").value) || null
    };
    try {
        await apiRequest(`/classrooms/${id}`, { method: "PUT", body: JSON.stringify(data) });
        document.getElementById("editClassroomModal").style.display = "none";
        await loadClassrooms();
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
};

document.getElementById("closeAddClassroomModal").onclick = () => {
    document.getElementById("addClassroomModal").style.display = "none";
};
document.getElementById("closeEditClassroomModal").onclick = () => {
    document.getElementById("editClassroomModal").style.display = "none";
};

document.getElementById("showClassroomsBtn").onclick = () => {
    document.getElementById("classroomsBlock").style.display = "block";
    document.getElementById("teachersBlock").style.display = "none";
    document.getElementById("disciplinesBlock").style.display = "none";
    document.getElementById("teachingsBlock").style.display = "none";
    loadClassrooms();
};
document.getElementById("loadClassroomsBtn").onclick = loadClassrooms;

async function loadTeachers() {
    clearError("teachersError");
    try {
        let teachers = await apiRequest("/teachers");
        let tbody = document.querySelector("#teachersTable tbody");
        tbody.innerHTML = "";
        for (let t of teachers) {
            let classroomName = t.classroom ? t.classroom.roomNumber + " (" + t.classroom.building + ")" : "-";
            let row = tbody.insertRow();
            row.insertCell(0).innerText = t.id;
            row.insertCell(1).innerText = (t.lastName || "") + " " + (t.firstName || "") + " " + (t.middleName || "");
            row.insertCell(2).innerText = classroomName;
            row.insertCell(3).innerText = t.rate || "-";

            let actionsCell = row.insertCell(4);
            let editBtn = document.createElement("button");
            editBtn.textContent = "✏️";
            editBtn.onclick = () => editTeacher(t.id);
            let deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑️";
            deleteBtn.onclick = () => deleteTeacher(t.id);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        }
    } catch (err) {
        document.getElementById("teachersError").innerText = "Ошибка: " + err.message;
    }
}

async function editTeacher(id) {
    try {
        let teacher = await apiRequest(`/teachers/${id}`);
        let classrooms = await apiRequest("/classrooms");

        document.getElementById("editTeacherId").value = teacher.id;
        document.getElementById("editTeacherLastName").value = teacher.lastName || "";
        document.getElementById("editTeacherFirstName").value = teacher.firstName || "";
        document.getElementById("editTeacherMiddleName").value = teacher.middleName || "";
        document.getElementById("editTeacherRate").value = teacher.rate || "";

        let select = document.getElementById("editTeacherClassroomId");
        select.innerHTML = '<option value="">Нет</option>';
        for (let c of classrooms) {
            let option = document.createElement("option");
            option.value = c.id;
            option.textContent = c.roomNumber + " (" + c.building + ")";
            if (teacher.classroomId === c.id) option.selected = true;
            select.appendChild(option);
        }

        document.getElementById("editTeacherModal").style.display = "block";
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
}

async function deleteTeacher(id) {
    if (!confirm("Точно удалить преподавателя?")) return;
    try {
        await apiRequest(`/teachers/${id}`, { method: "DELETE" });
        await loadTeachers();
    } catch (err) {
        alert("Ошибка удаления: " + err.message);
    }
}

document.getElementById("addTeacherBtn").onclick = async () => {
    try {
        let classrooms = await apiRequest("/classrooms");
        document.getElementById("addTeacherLastName").value = "";
        document.getElementById("addTeacherFirstName").value = "";
        document.getElementById("addTeacherMiddleName").value = "";
        document.getElementById("addTeacherRate").value = "";

        let select = document.getElementById("addTeacherClassroomId");
        select.innerHTML = '<option value="">Нет</option>';
        for (let c of classrooms) {
            let option = document.createElement("option");
            option.value = c.id;
            option.textContent = c.roomNumber + " (" + c.building + ")";
            select.appendChild(option);
        }

        document.getElementById("addTeacherModal").style.display = "block";
    } catch (err) {
        alert("Ошибка загрузки: " + err.message);
    }
};

document.getElementById("saveAddTeacherBtn").onclick = async () => {
    let classroomId = document.getElementById("addTeacherClassroomId").value;
    let data = {
        lastName: document.getElementById("addTeacherLastName").value,
        firstName: document.getElementById("addTeacherFirstName").value,
        middleName: document.getElementById("addTeacherMiddleName").value || null,
        classroomId: classroomId ? parseInt(classroomId) : null,
        rate: parseFloat(document.getElementById("addTeacherRate").value) || null
    };
    try {
        await apiRequest("/teachers", { method: "POST", body: JSON.stringify(data) });
        document.getElementById("addTeacherModal").style.display = "none";
        await loadTeachers();
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
};

document.getElementById("saveEditTeacherBtn").onclick = async () => {
    let id = parseInt(document.getElementById("editTeacherId").value);
    let classroomId = document.getElementById("editTeacherClassroomId").value;
    let data = {
        id: id,
        lastName: document.getElementById("editTeacherLastName").value,
        firstName: document.getElementById("editTeacherFirstName").value,
        middleName: document.getElementById("editTeacherMiddleName").value || null,
        classroomId: classroomId ? parseInt(classroomId) : null,
        rate: parseFloat(document.getElementById("editTeacherRate").value) || null
    };
    try {
        await apiRequest(`/teachers/${id}`, { method: "PUT", body: JSON.stringify(data) });
        document.getElementById("editTeacherModal").style.display = "none";
        await loadTeachers();
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
};

document.getElementById("closeAddTeacherModal").onclick = () => {
    document.getElementById("addTeacherModal").style.display = "none";
};
document.getElementById("closeEditTeacherModal").onclick = () => {
    document.getElementById("editTeacherModal").style.display = "none";
};

document.getElementById("showTeachersBtn").onclick = () => {
    document.getElementById("classroomsBlock").style.display = "none";
    document.getElementById("teachersBlock").style.display = "block";
    document.getElementById("disciplinesBlock").style.display = "none";
    document.getElementById("teachingsBlock").style.display = "none";
    loadTeachers();
};
document.getElementById("loadTeachersBtn").onclick = loadTeachers;

async function loadDisciplines() {
    clearError("disciplinesError");
    try {
        let disciplines = await apiRequest("/disciplines");
        let tbody = document.querySelector("#disciplinesTable tbody");
        tbody.innerHTML = "";
        for (let d of disciplines) {
            let row = tbody.insertRow();
            row.insertCell(0).innerText = d.id;
            row.insertCell(1).innerText = d.title;
            row.insertCell(2).innerText = d.hoursTotal || "-";
            row.insertCell(3).innerText = d.semester || "-";

            let actionsCell = row.insertCell(4);
            let editBtn = document.createElement("button");
            editBtn.textContent = "✏️";
            editBtn.onclick = () => editDiscipline(d.id);
            let deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑️";
            deleteBtn.onclick = () => deleteDiscipline(d.id);
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        }
    } catch (err) {
        document.getElementById("disciplinesError").innerText = "Ошибка: " + err.message;
    }
}

async function editDiscipline(id) {
    try {
        let discipline = await apiRequest(`/disciplines/${id}`);
        document.getElementById("editDisciplineId").value = discipline.id;
        document.getElementById("editTitle").value = discipline.title;
        document.getElementById("editHoursTotal").value = discipline.hoursTotal || "";
        document.getElementById("editSemester").value = discipline.semester || "";
        document.getElementById("editDisciplineModal").style.display = "block";
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
}

async function deleteDiscipline(id) {
    if (!confirm("Точно удалить дисциплину?")) return;
    try {
        await apiRequest(`/disciplines/${id}`, { method: "DELETE" });
        await loadDisciplines();
    } catch (err) {
        alert("Ошибка удаления: " + err.message);
    }
}

document.getElementById("addDisciplineBtn").onclick = () => {
    document.getElementById("addTitle").value = "";
    document.getElementById("addHoursTotal").value = "";
    document.getElementById("addSemester").value = "";
    document.getElementById("addDisciplineModal").style.display = "block";
};

document.getElementById("saveAddDisciplineBtn").onclick = async () => {
    let data = {
        title: document.getElementById("addTitle").value,
        hoursTotal: parseInt(document.getElementById("addHoursTotal").value) || null,
        semester: parseInt(document.getElementById("addSemester").value) || null
    };
    try {
        await apiRequest("/disciplines", { method: "POST", body: JSON.stringify(data) });
        document.getElementById("addDisciplineModal").style.display = "none";
        await loadDisciplines();
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
};

document.getElementById("saveEditDisciplineBtn").onclick = async () => {
    let id = parseInt(document.getElementById("editDisciplineId").value);
    let data = {
        id: id,
        title: document.getElementById("editTitle").value,
        hoursTotal: parseInt(document.getElementById("editHoursTotal").value) || null,
        semester: parseInt(document.getElementById("editSemester").value) || null
    };
    try {
        await apiRequest(`/disciplines/${id}`, { method: "PUT", body: JSON.stringify(data) });
        document.getElementById("editDisciplineModal").style.display = "none";
        await loadDisciplines();
    } catch (err) {
        alert("Ошибка: " + err.message);
    }
};

document.getElementById("closeAddDisciplineModal").onclick = () => {
    document.getElementById("addDisciplineModal").style.display = "none";
};
document.getElementById("closeEditDisciplineModal").onclick = () => {
    document.getElementById("editDisciplineModal").style.display = "none";
};

document.getElementById("showDisciplinesBtn").onclick = () => {
    document.getElementById("classroomsBlock").style.display = "none";
    document.getElementById("teachersBlock").style.display = "none";
    document.getElementById("disciplinesBlock").style.display = "block";
    document.getElementById("teachingsBlock").style.display = "none";
    loadDisciplines();
};
document.getElementById("loadDisciplinesBtn").onclick = loadDisciplines;

async function loadMyTeachings() {
    clearError("teachingsError");
    try {
        if (!currentUser || !currentUser.teacherId) {
            document.getElementById("teachingsError").innerText = "У вас нет привязанного преподавателя";
            return;
        }

        let teachings = await apiRequest(`/teachings/teacher/${currentUser.teacherId}`);
        let tbody = document.querySelector("#teachingsTable tbody");
        tbody.innerHTML = "";

        if (teachings.length === 0) {
            let row = tbody.insertRow();
            row.insertCell(0).innerText = "Нет данных";
            row.insertCell(1).innerText = "-";
            row.insertCell(2).innerText = "-";
        }

        for (let t of teachings) {
            let row = tbody.insertRow();
            row.insertCell(0).innerText = t.discipline?.title || "—";
            row.insertCell(1).innerText = (t.academicYear || "—") + " / " + (t.semester || "—");
            row.insertCell(2).innerText = t.hours || "-";
        }
    } catch (err) {
        document.getElementById("teachingsError").innerText = "Ошибка: " + err.message;
    }
}

document.getElementById("showMyTeachingsBtn").onclick = () => {
    document.getElementById("classroomsBlock").style.display = "none";
    document.getElementById("teachersBlock").style.display = "none";
    document.getElementById("disciplinesBlock").style.display = "none";
    document.getElementById("teachingsBlock").style.display = "block";
    loadMyTeachings();
};

window.addEventListener("load", function () {
    document.getElementById("loginBlock").style.display = "block";
});