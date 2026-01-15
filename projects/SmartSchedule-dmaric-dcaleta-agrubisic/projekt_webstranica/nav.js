/* -------------------------------------------------------------
   GLOBAL SMART NAVIGATION – samo Početna + Dashboard
   Zabranjen direktan ulaz u: personal, business-create, business-final
-------------------------------------------------------------- */

const allowedRoots = ["index", "dashboard"];
const internalPages = ["personal", "business-create"];

// trenutna stranica
let page = location.pathname.split("/").pop().replace(".html","") || "index";

// Ograničenja pristupa
if (internalPages.includes(page)) {
    // Preferiramo provjeru prijavljenog korisnika iz auth.js (ako je dostupna)
    try {
        if (window.ssAuth && typeof ssAuth.getCurrentUser === 'function') {
            const user = ssAuth.getCurrentUser();
            // ako nije prijavljen — redirect na index
            if (!user) {
                location.href = "index.html";
            } else {
                // dodatno ograničavanje: poslovne stranice samo za poslodavce
                if (["business-create", "business-final"].includes(page) && !user.isBoss) {
                    // nije poslodavac → vrati na dashboard
                    location.href = "dashboard.html";
                }
            }
        } else {
            // fallback na staru logiku temeljenu na zadnjoj posjećenoj stranici
            const cameFrom = sessionStorage.getItem("lastPage");
            if (!cameFrom || !allowedRoots.includes(cameFrom)) {
                location.href = "index.html";
            }
        }
    } catch (e) {
        // u slučaju greške, sigurnosno preusmjeri na index
        location.href = "index.html";
    }
}

// Spremanje zadnje stranice
sessionStorage.setItem("lastPage", page);
