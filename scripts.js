let selectedX = null; // Переменная для хранения выбранного X
let tableCreated = false;

// Отправка данных на сервер
function sendData() {
    const x = selectedX; // Используем выбранное значение X
    const y = parseFloat(document.getElementById('y').value);
    const r = parseFloat(document.getElementById('r').value);

    // Проверка на валидность входных данных
    if (!validateInput(x, y, r)) {
        return;
    }

    const data = JSON.stringify({ x, y, r });

    fetch('/fcgi-bin/server.jar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data
    })
        .then(response => {
            if (response.status === 400) {
                return response.json().then(json => {
                    throw new Error(json.error);
                });
            }
            return response.json();
        })
        .then(json => {
            if (!tableCreated) {
                createTable();
                tableCreated = true;
            }
            addRow(json);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('error-message').textContent = error.message;
            document.getElementById('error-message').style.display = 'block';
        });
}

// Создание таблицы для отображения результатов
function createTable() {
    const resultContainer = document.getElementById('results');
    const table = document.createElement('table');
    table.setAttribute('id', 'resultTable');
    table.innerHTML = `
        <tr>
            <th>X</th>
            <th>Y</th>
            <th>R</th>
            <th>Result</th>
            <th>Current Time</th>
            <th>Execution Time</th>
        </tr>
    `;
    resultContainer.appendChild(table);
}

// Добавление строки с результатами в таблицу
function addRow(json) {
    const resultTable = document.getElementById('resultTable');

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${json.x}</td>
        <td>${json.y}</td>
        <td>${json.r}</td>
        <td>${json.result}</td>
        <td>${json.currentTime}</td>
        <td>${json.executionTime}</td>
    `;
    resultTable.appendChild(newRow);

    // Сохранение результатов в localStorage
    let results = JSON.parse(localStorage.getItem('results')) || [];
    results.push(json);
    localStorage.setItem('results', JSON.stringify(results));
}

// Валидация входных данных
function validateInput(x, y, r) {
    const errorMessage = document.getElementById('error-message');

    if (x === null || isNaN(y) || isNaN(r) || r < 1 || r > 4 || y < -3 || y > 3) {
        errorMessage.textContent = 'Invalid input values. Please select a valid X and enter correct Y and R values.';
        errorMessage.style.display = 'block';
        return false;
    }

    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    return true;
}

// Выбор значения X
function selectX(xValue) {
    const buttons = document.querySelectorAll("#x-buttons button");

    // Если нажали на уже выбранное значение, снимаем выделение
    if (selectedX === xValue) {
        selectedX = null;
        buttons.forEach(button => button.classList.remove("selected"));
        return;
    }

    // Если выбрали другое значение, обновляем выбор
    buttons.forEach(button => button.classList.remove("selected"));
    selectedX = xValue;

    const selectedButton = Array.from(buttons).find(button => button.textContent == xValue);
    if (selectedButton) {
        selectedButton.classList.add("selected");
    }
}

// Очистка результатов
function clearResults() {
    // Удаляем результаты из localStorage
    localStorage.removeItem('results');

    // Очищаем контейнер результатов
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Удаляем все содержимое контейнера

    // Находим таблицу и удаляем её, если она существует
    const resultTable = document.getElementById('resultTable');
    if (resultTable) {
        resultTable.remove();
        tableCreated = false; // Сбрасываем флаг создания таблицы
    }
}

// Рисуем координатную систему
function drawCoordinateSystem() {
    const canvas = document.getElementById("plotCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientWidth;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = canvas.width / 3;

    ctx.fillStyle = "#4a90e2";

    // Треугольник
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + scale, centerY);
    ctx.lineTo(centerX, centerY + scale / 2);
    ctx.closePath();
    ctx.fill();

    // Четверть круга
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, scale / 2, 0, -0.5 * Math.PI, true);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();

    // Прямоугольник
    ctx.beginPath();
    ctx.rect(centerX, centerY, -scale / 2, -scale);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    // Ось X
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // Ось Y
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // Стрелочки
    drawArrow(ctx, canvas.width - 10, centerY, canvas.width, centerY);
    drawArrow(ctx, centerX, 10, centerX, 0);

    ctx.font = "14px Arial";
    ctx.fillStyle = "rgb(0,0,0)";

    // Отметки на осях X
    drawTickMark(ctx, centerX + scale, centerY, 10);
    ctx.fillText("R", centerX + scale - 5, centerY - 20);

    drawTickMark(ctx, centerX + scale / 2, centerY, 10);
    ctx.fillText("R/2", centerX + scale / 2 - 10, centerY - 20);

    drawTickMark(ctx, centerX - scale, centerY, 10);
    ctx.fillText("-R", centerX - scale - 10, centerY - 20);

    drawTickMark(ctx, centerX - scale / 2, centerY, 10);
    ctx.fillText("-R/2", centerX - scale / 2 - 15, centerY - 20);

    // Отметки на оси Y
    drawTickMark(ctx, centerX, centerY - scale, 10);
    ctx.fillText("R", centerX + 10, centerY - scale + 5);

    drawTickMark(ctx, centerX, centerY - scale / 2, 10);
    ctx.fillText("R/2", centerX + 10, centerY - scale / 2 + 5);

    drawTickMark(ctx, centerX, centerY + scale / 2, 10);
    ctx.fillText("-R/2", centerX + 10, centerY + scale / 2 + 5);

    drawTickMark(ctx, centerX, centerY + scale, 10);
    ctx.fillText("-R", centerX + 10, centerY + scale + 5);

    // Горизонтальные палочки
    const tickSize = 5;
    const tickYPositions = [centerY - scale, centerY - scale / 2, centerY + scale / 2, centerY + scale];
    tickYPositions.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(centerX - tickSize, y);
        ctx.lineTo(centerX + tickSize, y);
        ctx.strokeStyle = "#000";
        ctx.stroke();
    });

    // Подписи осей
    ctx.fillText("X", canvas.width - 30, centerY - 10);
    ctx.fillText("Y", centerX + 10, 20);
}

// Функция для рисования стрелок
function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLength = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

// Функция для рисования отметок
function drawTickMark(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x, y + size / 2);
    ctx.stroke();
}

// Загрузка результатов из localStorage
function loadResults() {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    if (results.length > 0) {
        createTable();
        results.forEach(result => addRow(result));
        tableCreated = true;
    }
}

// Инициализация страницы
window.onload = function() {
    drawCoordinateSystem();
    loadResults();
};
