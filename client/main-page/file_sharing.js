const UserName = localStorage.getItem("auth_name")
const userName = document.querySelector(".user-name")

userName.innerHTML = `
<span id="user-name">${UserName}</span>`

const form = document.querySelector(".upload_files")
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fileInput = document.getElementById("upload_file");
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('up_file', file);

    fetch('http://localhost:3000/upload', {
        method: "POST",
        body: formData,
    })
        .then(response => response.text())
        .then(message => {
            console.log(message);
            fetch('http://localhost:3000/getFiles')
                .then(response => response.json())
                .then(rows => {
                    JSON.stringify(rows)
                    console.log(rows)
                    const filesContainer = document.getElementById("files");
                    filesContainer.innerHTML = ""; // Очищаем предыдущий список

                    // Создаем элементы списка для каждого файла
                    rows.forEach(file => {
                        const fileElement = document.createElement("div");
                        fileElement.innerHTML = `<span>${file.Name}</span>`
                        filesContainer.appendChild(fileElement);
                    });
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
});