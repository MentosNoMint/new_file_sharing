const UserName = localStorage.getItem("auth_name")
const userName = document.querySelector(".user-name")

userName.innerHTML = `
<span id="user-name">${UserName}</span>`

const form = document.querySelector(".upload_files")
form.addEventListener("submit", (e) => {
    e.preventDefault()
    const files = document.getElementById("upload_file").files

    const addFiles = document.querySelector(".files")

    for (let i = 0; i < files.length; i++) {
        const fileTag = document.createElement("p")
        fileTag.textContent = files[i].name
        addFiles.appendChild(fileTag)
    }
})