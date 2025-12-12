<script>
/* -------------------------------------------------------------
   GLOBAL SMART NAVIGATION – samo Početna + Dashboard
   Zabranjen direktan ulaz u: personal, business-create, business-final
-------------------------------------------------------------- */

const allowedRoots = ["index", "dashboard"];
const internalPages = ["personal", "business-create", "business-final"];

// trenutna stranica
let page = location.pathname.split("/").pop().replace(".html","") || "index";

// Ograničenja pristupa
if (internalPages.includes(page)) {
    const cameFrom = sessionStorage.getItem("lastPage");

    if (!cameFrom || !allowedRoots.includes(cameFrom)) {
        location.href = "index.html";
    }
}

// Spremanje zadnje stranice
sessionStorage.setItem("lastPage", page);
</script>
