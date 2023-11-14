const form = document.querySelector("form")

form.addEventListener("submit", (e) => {
    e.preventDefault()
    const sign_name = document.getElementById("sign_name").value
    const sign_pass = document.getElementById("sign_pass").value

    fetch("http://localhost:3000/file_sharing/registration", {
        mode: "no-cors",
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ sign_name, sign_pass })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.log(error))
})