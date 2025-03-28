function loadCategories() {
    fetch("https://openapi.programming-hero.com/api/levels/all")
        .then((res) => res.json())
        .then((data) => displays(data.data))
        .catch(error => console.error('Error loading categories:', error));
}

function displays(display) {
    const btnContainer = document.getElementById("btn-container");
    btnContainer.innerHTML = "";  

    for (let dis of display) {
        const btnDiv = document.createElement("div");
        btnDiv.innerHTML = `
            <button class="btn bg-white btn-outline btn-primary text-[#422AD5] hover:text-white hover:bg-[#422AD5]" data-level-no="${dis.level_no}">
                <i class="fa-solid fa-book-open"></i>Lesson-${dis.level_no}
            </button>
        `;
        
        const button = btnDiv.querySelector("button");
        button.addEventListener("click", function() {
            document.querySelectorAll("#btn-container button").forEach(btn => btn.classList.remove("active"));
            document.getElementById("nothing").style.display = "none";
            button.classList.add("active");
            loadLesson(dis.level_no);  
        });
        btnContainer.append(btnDiv);
    }
}

document.getElementById("scrollBtn").addEventListener("click", function() {
    let targetSection = document.getElementById("section-question");
    if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" }); // Smooth scrolling effect
    }
});


document.getElementById("scrollBtn-2").addEventListener("click", function() {
    let targetSection = document.getElementById("cards");
    if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" }); // Smooth scrolling effect
    }
});


const loadLesson = (id) => {  

    const naimdiv = document.getElementById("word-div");
    naimdiv.innerHTML = `
        <div id="loading" class="text-center col-span-3">
            <span class="loading loading-dots loading-lg"></span>
            <span class="loading loading-dots loading-lg"></span>
        </div>
    `; // Show loading before fetching


    fetch(`https://openapi.programming-hero.com/api/level/${id}`)
        .then(response => response.json())
        .then(data => {
            const naimdiv = document.getElementById("word-div");
            naimdiv.innerHTML = "";  
            
            if (!data.data || data.data.length === 0) {
                naimdiv.innerHTML = `<div class="flex flex-col justify-center col-span-3 text-center">
        <div class="flex justify-center">
            <img src="assets/alert-error.png" alt="">
        </div>      
        <h1 class="text-[#79716B] text-xl">এই Lesson এ এখনো কোন Vocabulary যুক্ত করা হয়নি।</h1>
        <h1 class="font-bold pb-4 text-4xl">নেক্সট Lesson এ যান</h1>
    </div>`;
                return;
            }
            document.getElementById("nothing").style.display = "none";
            data.data.forEach(item => {
                const everydiv = document.createElement("div");
                everydiv.innerHTML = `
                    <div class="card text-lg font-bold bg-base-100 h-60 shadow-sm hover:bg-[#422AD510] transition-colors">
                        <div class="card-body text-lg font-bold text-center">
                            <h2 class="text-lg font-bold">${item.word}</h2>
                            <p class="text-lg font-bold">Meaning / Pronunciation</p>
                            <h2 class="text-lg font-bold">"${item.meaning} / ${item.pronunciation}"</h2>
                            <div class="card-actions flex justify-between">
                                <button onclick="fetchWords(${item.id})" class="btn btn-square"> <i class="fa-solid fa-circle-info"></i></button>
                                <button onclick="fetchWords1(${item.id})" class="btn btn-square"><img class="w-7 h-6" src="https://img.icons8.com/?size=100&id=41563&format=png" alt=""></button>
                            </div>
                        </div>
                    </div>
                `;
                naimdiv.append(everydiv);
            });
        })
        .catch(error => console.error('Error fetching the lesson data:', error));
}

const fetchWords1 = (wordId) => {
    fetch(`https://openapi.programming-hero.com/api/word/${wordId}`)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error fetching word:', error));
}

const fetchWords = (wordId) => {
    fetch(`https://openapi.programming-hero.com/api/word/${wordId}`)
        .then(response => response.json())
        .then(data => {
            if (!data.data) {
                alert('No data found for this word');
                return;
            }

            // POP up part

            const modal = document.getElementById("my_modal_1");
            modal.innerHTML = "";  
            modal.showModal();  

            const diadiv = document.createElement("div");
            diadiv.innerHTML = `
                <div class="modal-box ">
                    <div class="bg-[#EDF7FF35] border-2 px-2 border-[#EDF7FF] rounded-lg">
                        <h2 class="text-lg font-bold">${data.data.word} (<span><i class="fa-solid fa-microphone-lines"></i></span> :${data.data.pronunciation})</h2>
                        <h3 class="text-lg font-bold">Meaning</h3>
                        <p>${data.data.meaning || 'অর্থ পাওয়া যায় নি'}</p>
                        <h3 class="text-lg font-bold">Example</h3>
                        <p>${data.data.sentence}</p>
                        <h3 class="text-lg font-bold">Synonyms</h3>
                        <div id="synonym-buttons-container"></div>
                    </div>
                    <div class="modal-action flex justify-start">
                        <form method="dialog">
                            <button class="btn px-4 text-white bg-[#422AD5]" onclick="closeModal()">Complete Learning</button>
                        </form>
                    </div>
                </div>
            `;
            
            const synonymContainer = diadiv.querySelector("#synonym-buttons-container");
            if (data.data.synonyms?.length) {
                data.data.synonyms.forEach((synonym) => {
                    const button = document.createElement("button");
                    button.className = "btn btn-primary m-1";
                    button.textContent = synonym;
                    button.style.backgroundColor = "#EDF7FF";
                    button.style.color = "black";
                    button.disabled = true;
                    synonymContainer.appendChild(button);
                });
            } else {
                synonymContainer.innerHTML = "দুঃখিত!";
            }
            modal.append(diadiv);
        })
        .catch(error => console.error("Error fetching word details:", error));
}

const closeModal = () => {
    document.getElementById("my_modal_1").close();
}

loadCategories();
