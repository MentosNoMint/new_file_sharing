const form = document.querySelector("form")

form.addEventListener("submit", (e) => {
    e.preventDefault()
    const auth_name = document.getElementById("auth_name").value
    const auth_pass = document.getElementById("auth_pass").value

    fetch("http://localhost:3000/file_sharing/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ auth_name, auth_pass })
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log(error))
})