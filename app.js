const API_BASE = "http://localhost:5233/api/v1";

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
