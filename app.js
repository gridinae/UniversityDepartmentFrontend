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

        if (currentUser.role === 1) { // secretary
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


/*
// Вход
const respLogin = fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "login": "secretary", "password": "123" }),
});

// Получение информации об аккаунте
const currentUser = await apiRequest("/auth/me");

// Получение информации об аудиториях
const classrooms = await apiRequest("/classrooms");

// Редактирование аудитории
const id = 0;
const classroom = await apiRequest(`/classrooms/${id}`);

// Удаление аудитории
const id = 0
apiRequest(`/classrooms/${id}`, { method: "DELETE" });

// Добавление аудитории
const addClassroomBody =
{
    roomNumber: 102,
    building: 1,
    capacity: 20
}
await apiRequest("/classrooms", { method: "POST", body: JSON.stringify(addClassroomBody) });
*/