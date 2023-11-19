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
        .then(data => {
            localStorage.setItem("auth_name", JSON.stringify(data.UserName))
            localStorage.setItem("auth_token", JSON.stringify(data.Token))
            if (localStorage.getItem("auth_token") !== null) {
                window.location.replace("/client/main-page/file_sharing.html")
            }
        })
        .catch(error => console.log(error))
})