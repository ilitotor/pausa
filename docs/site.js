document.addEventListener("DOMContentLoaded", () => {
    const userLang = navigator.language.startsWith("pt") ? "pt_BR" : "en";
    let currentLang = localStorage.getItem("pausa_site_lang") || userLang;

    const langToggleBtn = document.getElementById("langToggle");

    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem("pausa_site_lang", lang);

        document.querySelectorAll("[data-i18n]").forEach(elem => {
            const key = elem.getAttribute("data-i18n");
            if (SITE_I18N[lang] && SITE_I18N[lang][key]) {
                elem.textContent = SITE_I18N[lang][key];
            }
        });

        document.querySelectorAll("[data-i18n-src]").forEach(elem => {
            const key = elem.getAttribute("data-i18n-src");
            if (SITE_I18N[lang] && SITE_I18N[lang][key]) {
                elem.src = SITE_I18N[lang][key];
            }
        });

        if (langToggleBtn) {
            langToggleBtn.textContent = lang === "pt_BR" ? "EN" : "PT";
        }
    }

    if (langToggleBtn) {
        langToggleBtn.addEventListener("click", () => {
            applyLanguage(currentLang === "pt_BR" ? "en" : "pt_BR");
        });
    }

    applyLanguage(currentLang);
});