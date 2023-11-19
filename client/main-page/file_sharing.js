const UserName = localStorage.getItem("auth_name")
const userName = document.querySelector(".user-name")

userName.innerHTML = `
<span id="user-name">${UserName}</span>`