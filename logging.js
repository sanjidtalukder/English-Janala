document.getElementById("footer").style.display = "block";
document.getElementById("header").style.display = "none";
document.getElementById("section-question").style.display = "none";
document.getElementById("cards").style.display = "none";

document.getElementById("submit").addEventListener("click", function (event) {
    event.preventDefault();

    const UserName = document.getElementById("Username").value;
    const passWord = document.getElementById("password").value;

    console.log(UserName)
    const newpassWord = parseInt(passWord)

    if (UserName !== "") {

        if (newpassWord === 123456) {

            // SweetAlert for successful login
            Swal.fire({
                position: "center",
                icon: "success",
                title: "Welcome to English জানালা",
                showConfirmButton: false,
                timer: 1600
            });

            document.getElementById("header").style.display = "block";
            document.getElementById("header").style.display.position = "sticky";
            document.getElementById("text").style.display = "none";
            document.getElementById("form").innerHTML =
                `<h1 class="text-2xl">
                <span class="text-5xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">${UserName}</span>
                আপনাকে English জানালা'তে স্বাগতম
                </h1>`;
            document.getElementById("baner-1").style.display = "none";
            document.getElementById("cards").style.display = "block";
            document.getElementById("section-question").style.display = "block";
            // document.getElementById("my_modal_2").showModal();

        } else {
            alert("Wrong password!");
        }
    } else {
        alert("Please enter your name and password!");
    }

    document.getElementById("Username").value = "";
    document.getElementById("password").value = "";
});

function reloadPage() {
    location.reload();
}