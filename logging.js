const authForm = document.getElementById("form");
const authNameField = document.getElementById("auth-name-field");
const authSubmit = document.getElementById("submit");
const authModeSwitch = document.getElementById("auth-mode-switch");
let isSignupMode = false;
authNameField.classList.add("hidden");

document.getElementById("footer").style.display = "block";
document.getElementById("header").style.display = "none";
document.getElementById("section-question").style.display = "none";
document.getElementById("cards").style.display = "none";

authModeSwitch.addEventListener("click", () => {
    isSignupMode = !isSignupMode;
    authNameField.classList.toggle("hidden", !isSignupMode);
    document.getElementById("auth-password").setAttribute("autocomplete", isSignupMode ? "new-password" : "current-password");
    authSubmit.textContent = isSignupMode ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন";
    authModeSwitch.textContent = isSignupMode ? "Login-এ ফিরে যান" : "নতুন account তৈরি করুন";
});

document.getElementById("demo-button").addEventListener("click", async () => {
    const demoButton = document.getElementById("demo-button");
    demoButton.disabled = true;
    try {
        await window.startDemoSession();
        Swal.fire({ position: "center", icon: "success", title: "Demo mode", text: "এখানে আপনার পরিবর্তন শুধু এই browser-এ থাকবে।", showConfirmButton: false, timer: 1700 });
    } catch (error) {
        Swal.fire({ icon: "error", title: "Demo চালু হয়নি", text: error.message });
    } finally {
        demoButton.disabled = false;
    }
});

authForm.addEventListener("submit", async event => {
    event.preventDefault();
    authSubmit.disabled = true;
    const payload = {
        name: document.getElementById("auth-name").value.trim(),
        email: document.getElementById("auth-email").value.trim(),
        password: document.getElementById("auth-password").value,
    };
    try {
        const response = await fetch(isSignupMode ? "/api/auth/signup" : "/api/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Login করা যায়নি।");
        await window.startLearningSession(result.user);
        Swal.fire({ position: "center", icon: "success", title: `স্বাগতম, ${result.user.name}`, showConfirmButton: false, timer: 1400 });
    } catch (error) {
        Swal.fire({ icon: "error", title: "Login হয়নি", text: error.message });
    } finally {
        authSubmit.disabled = false;
        document.getElementById("auth-password").value = "";
    }
});

document.getElementById("logout-button").addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    location.reload();
});

(async function restoreSession() {
    try {
        const query = new URLSearchParams(location.search);
        const tokenHash = query.get("token_hash");
        const verificationType = query.get("type");
        if (tokenHash && ["signup", "email"].includes(verificationType)) {
            const verifyResponse = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tokenHash, type: verificationType }) });
            const verification = await verifyResponse.json();
            history.replaceState({}, "", location.pathname);
            if (!verifyResponse.ok) throw new Error(verification.error || "Email যাচাই করা যায়নি।");
            await window.startLearningSession(verification.user);
            Swal.fire({ icon: "success", title: "Email যাচাই হয়েছে", text: "আপনার account তৈরি হয়েছে।" });
            return;
        }
        const response = await fetch("/api/auth/session");
        if (!response.ok) return;
        const result = await response.json();
        await window.startLearningSession(result.user);
    } catch (error) {
        console.error("Session restore failed:", error);
    }
})();

function reloadPage() { location.reload(); }
