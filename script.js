let activeUser = null;
let completedWordIds = new Set();
let completedWordRows = [];
let currentLessonItems = [];
let currentLessonNo = 1;
let wordCache = new Map();
let quizQueue = [];
let quizIndex = 0;
let reviewQueue = [];
let reviewIndex = 0;
let dailyGoal = 5;
const DEMO_PROGRESS_KEY = "englishJanalaDemoProgress";
const DEMO_ACTIVITY_KEY = "englishJanalaDemoActivity";
const DEMO_GOAL_KEY = "englishJanalaDemoGoal";
const DEMO_SAVED_WORDS_KEY = "englishJanalaDemoSavedWords";
const TOPIC_LESSONS = [
    { id: 11, title: "শুরুর শব্দ · Beginner", difficulty: "সহজ", words: ["apple", "book", "family", "friend", "happy", "learn"] },
    { id: 12, title: "দৈনন্দিন জীবন · Daily Life", difficulty: "সহজ", words: ["morning", "water", "house", "market", "kitchen", "neighbor"] },
    { id: 13, title: "ভ্রমণ · Travel", difficulty: "মাঝারি", words: ["airport", "ticket", "journey", "hotel", "map", "luggage"] },
    { id: 14, title: "খাবার · Food", difficulty: "সহজ", words: ["bread", "breakfast", "delicious", "vegetable", "hungry", "restaurant"] },
    { id: 15, title: "কাজ ও পড়াশোনা · Work & Study", difficulty: "মাঝারি", words: ["teacher", "student", "computer", "question", "answer", "practice"] },
];

const COMMON_PRONUNCIATIONS = {
    apple: "অ্যাপল", book: "বুক", family: "ফ্যামিলি", friend: "ফ্রেন্ড", happy: "হ্যাপি", learn: "লার্ন",
    morning: "মর্নিং", water: "ওয়াটার", house: "হাউস", market: "মার্কেট", kitchen: "কিচেন", neighbor: "নেইবার",
    airport: "এয়ারপোর্ট", ticket: "টিকেট", journey: "জার্নি", hotel: "হোটেল", map: "ম্যাপ", luggage: "লাগেজ",
    bread: "ব্রেড", breakfast: "ব্রেকফাস্ট", delicious: "ডিলিশিয়াস", vegetable: "ভেজিটেবল", hungry: "হাংরি", restaurant: "রেস্টুরেন্ট",
    teacher: "টিচার", student: "স্টুডেন্ট", computer: "কম্পিউটার", question: "কোয়েশ্চেন", answer: "অ্যানসার", practice: "প্র্যাকটিস",
    doctor: "ডক্টর", school: "স্কুল", money: "মানি", time: "টাইম", work: "ওয়ার্ক", study: "স্টাডি",
    english: "ইংলিশ", orange: "অরেঞ্জ", mango: "ম্যাঙ্গো", garden: "গার্ডেন", street: "স্ট্রিট",
    love: "লাভ", beautiful: "বিউটিফুল", success: "সাকসেস", dream: "ড্রিম", life: "লাইফ", hope: "হোপ", peace: "পিস"
};

const COMMON_BENGALI_MEANINGS = {
    apple: "আপেল", book: "বই", family: "পরিবার", friend: "বন্ধু", happy: "সুখী / আনন্দিত", learn: "শেখা",
    morning: "সকাল", water: "পানি", house: "বাড়ি / ঘর", market: "বাজার", kitchen: "রান্নাঘর", neighbor: "প্রতিবেশী",
    airport: "বিমানবন্দর", ticket: "টিকেট", journey: "ভ্রমণ / যাত্রা", hotel: "হোটেল", map: "মানচিত্র", luggage: "মালামাল / লাগেজ",
    bread: "রুটি", breakfast: "সকালের নাস্তা", delicious: "সুস্বাদু", vegetable: "শাকসবজি", hungry: "ক্ষুধার্ত", restaurant: "রেস্তোরাঁ",
    teacher: "শিক্ষক", student: "শিক্ষার্থী / ছাত্র", computer: "কম্পিউটার", question: "প্রশ্ন", answer: "উত্তর", practice: "অনুশীলন",
    doctor: "চিকিৎসক", school: "বিদ্যালয়", money: "টাকা / অর্থ", time: "সময়", work: "কাজ", study: "পড়াশোনা",
    love: "ভালোবাসা / স্নেহ", beautiful: "সুন্দর", success: "সাফল্য", dream: "স্বপ্ন", life: "জীবন", hope: "আশা", peace: "শান্তি"
};

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

async function loadProgress() {
    if (activeUser?.isDemo) {
        let saved = JSON.parse(localStorage.getItem(DEMO_PROGRESS_KEY) || "null");
        if (!saved?.completedWords?.length) {
            const response = await fetch("https://openapi.programming-hero.com/api/level/1");
            const data = await response.json();
            const today = new Date().toISOString();
            saved = { completedWords: (data.data || []).slice(0, 3).map(item => ({ word_id: String(item.id), lesson_no: 1, completed_at: today, review_due_at: new Date(Date.now() - 60000).toISOString(), review_stage: 0, quiz_correct: 0, quiz_attempts: 0 })) };
            localStorage.setItem(DEMO_PROGRESS_KEY, JSON.stringify(saved));
            if (!localStorage.getItem(DEMO_ACTIVITY_KEY)) localStorage.setItem(DEMO_ACTIVITY_KEY, JSON.stringify(saved.completedWords.map(() => ({ date: today.slice(0, 10), event_type: "word_completed" }))));
        }
        completedWordRows = saved.completedWords || [];
        completedWordIds = new Set(completedWordRows.map(item => String(item.word_id)));
        return;
    }
    const response = await fetch("/api/progress");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Progress লোড করা যায়নি।");
    completedWordRows = result.completedWords || [];
    completedWordIds = new Set(completedWordRows.map(item => String(item.word_id)));
}

let liveSearchTimeout = null;

function applyWordFilters() {
    const search = document.getElementById("word-search").value.trim().toLocaleLowerCase();
    const filter = document.getElementById("word-filter").value;
    let visibleCount = 0;
    const cards = document.querySelectorAll("#word-div [data-word-id]");
    cards.forEach(card => {
        const done = completedWordIds.has(card.dataset.wordId);
        const matchesSearch = card.dataset.search.includes(search);
        const matchesStatus = filter === "all" || (filter === "completed" ? done : !done);
        const isVisible = matchesSearch && matchesStatus;
        card.classList.toggle("hidden", !isVisible);
        if (isVisible) visibleCount++;
    });

    // If word is not in current lesson and has at least 2 letters, seamlessly fetch and show card
    if (cards.length > 0 && visibleCount === 0 && /^[a-z][a-z'-]{1,59}$/.test(search)) {
        clearTimeout(liveSearchTimeout);
        liveSearchTimeout = setTimeout(() => {
            searchDictionaryWord(search);
        }, 500);
    } else {
        clearTimeout(liveSearchTimeout);
    }
}

function loadCategories() {
    fetch("https://openapi.programming-hero.com/api/levels/all")
        .then((res) => res.json())
        .then((data) => { window.lessonLevels = data.data || []; displays(data.data || []); })
        .catch(() => { window.lessonLevels = []; displays([]); });
}

async function getDictionaryEntry(word) {
    const key = String(word).trim().toLowerCase();
    if (!/^[a-z][a-z'-]{0,59}$/.test(key)) throw new Error("শুধু একটি English word লিখুন।");
    const cached = wordCache.get(`dict:${key}`);
    if (cached?.dictionary) return cached;
    const response = await fetch(`/api/dictionary?word=${encodeURIComponent(key)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "শব্দটি খুঁজে পাওয়া যায়নি।");
    const entry = result.entry?.[0];
    if (!entry) throw new Error("এই শব্দের dictionary entry পাওয়া যায়নি।");
    const definitions = entry.meanings.flatMap(meaning => meaning.definitions.map(definition => ({ ...definition, partOfSpeech: meaning.partOfSpeech })));
    const firstDef = definitions.find(d => d.definition && d.definition.length > 5)?.definition || definitions[0]?.definition || "Definition দেওয়া নেই";
    const mappedPron = COMMON_PRONUNCIATIONS[key] || entry.phonetic || "";
    const displayMeaning = COMMON_BENGALI_MEANINGS[key] || firstDef;
    const item = {
        id: `dict:${key}`, word: entry.word || key,
        meaning: displayMeaning,
        pronunciation: mappedPron, sentence: definitions.find(definition => definition.example)?.example || "",
        synonyms: [...new Set(definitions.flatMap(definition => definition.synonyms || []))].slice(0, 8),
        antonyms: [...new Set(definitions.flatMap(definition => definition.antonyms || []))].slice(0, 8),
        dictionary: entry, topic: "My words",
    };
    wordCache.set(item.id, item);
    return item;
}

async function loadTopicLesson(topic) {
    currentLessonNo = topic.id;
    document.getElementById("nothing").style.display = "none";
    document.getElementById("word-div").innerHTML = `<div class="col-span-3 py-8 text-center"><span class="loading loading-dots loading-lg"></span><p>${escapeHTML(topic.title)} শব্দ লোড হচ্ছে…</p></div>`;
    document.querySelectorAll("#btn-container button").forEach(button => button.classList.toggle("active", Number(button.dataset.topicNo) === topic.id));
    const entries = await Promise.allSettled(topic.words.map(getDictionaryEntry));
    currentLessonItems = entries.filter(result => result.status === "fulfilled").map(result => ({ ...result.value, topic: topic.title, difficulty: topic.difficulty }));
    if (!currentLessonItems.length) {
        document.getElementById("word-div").innerHTML = `<p class="col-span-3 p-6 text-center text-red-700">Dictionary থেকে শব্দ আনা যায়নি। Internet সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।</p>`;
        return;
    }
    renderLessonItems();
    if (entries.some(result => result.status === "rejected")) {
        const note = document.createElement("p"); note.className = "col-span-3 text-center text-sm text-amber-700";
        note.textContent = "কিছু শব্দ API-তে পাওয়া যায়নি; বাকি শব্দ দেখানো হয়েছে।";
        document.getElementById("word-div").append(note);
    }
}

async function loadSavedWords() {
    currentLessonNo = 100;
    document.getElementById("nothing").style.display = "none";
    document.querySelectorAll("#btn-container button").forEach(button => button.classList.toggle("active", button.dataset.savedWords === "true"));
    const container = document.getElementById("word-div");
    container.innerHTML = `<div class="col-span-3 py-8 text-center"><span class="loading loading-dots loading-lg"></span><p>আপনার My Words লোড হচ্ছে…</p></div>`;
    try {
        let rows;
        if (activeUser?.isDemo) rows = JSON.parse(localStorage.getItem(DEMO_SAVED_WORDS_KEY) || "[]");
        else {
            const response = await fetch("/api/saved-words"); const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Saved words আনা যায়নি।");
            rows = result.words || [];
        }
        currentLessonItems = rows.map(row => {
            const entry = row.word_data?.dictionary ? row.word_data : row.word_data;
            const item = entry.id ? { ...entry, topic: row.topic || entry.topic, inSavedList: true } : { ...entry, id: row.word_id, dictionary: entry.dictionary || entry, topic: row.topic, inSavedList: true };
            wordCache.set(String(item.id), item);
            return item;
        });
        if (!currentLessonItems.length) {
            container.innerHTML = `<div class="col-span-3 rounded-xl bg-white p-8 text-center"><h2 class="text-xl font-bold">My Words এখনো খালি</h2><p class="mt-2 text-gray-600">Dictionary search করুন, তারপর “Save word” চাপুন।</p></div>`;
            return;
        }
        renderLessonItems();
    } catch (error) {
        container.innerHTML = `<p class="col-span-3 p-6 text-center text-red-700">${escapeHTML(error.message)}</p>`;
    }
}

async function searchDictionaryWord(word) {
    const container = document.getElementById("word-div");
    container.innerHTML = `<div class="col-span-3 py-12 text-center"><span class="loading loading-dots loading-lg text-[#422AD5]"></span><p class="mt-3 text-gray-600 font-medium">“${escapeHTML(word)}” লোড হচ্ছে…</p></div>`;
    document.getElementById("nothing").style.display = "none";
    try {
        const item = await getDictionaryEntry(word);
        currentLessonNo = 100;
        currentLessonItems = [{ ...item, topic: "English Vocabulary" }];
        renderLessonItems();
    } catch (error) {
        container.innerHTML = `<div class="col-span-3 rounded-xl bg-white p-8 text-center border border-gray-100 shadow-sm"><h2 class="text-lg font-bold text-gray-800">শব্দটি পাওয়া যায়নি</h2><p class="mt-2 text-gray-600">${escapeHTML(error.message)}</p><p class="mt-1 text-sm text-gray-400">বানান যাচাই করে আবার চেষ্টা করুন।</p></div>`;
    }
}

async function saveDictionaryWord(item, topic = "My words") {
    const meanings = item?.dictionary?.meanings || item?.meanings || [{ partOfSpeech: "noun", definitions: [{ definition: item.meaning || "" }] }];
    const wordData = {
        ...item,
        meanings,
        topic
    };
    if (activeUser?.isDemo) {
        const saved = JSON.parse(localStorage.getItem(DEMO_SAVED_WORDS_KEY) || "[]");
        if (!saved.some(row => row.word_id === item.id)) saved.unshift({ word_id: item.id, topic, word_data: wordData });
        localStorage.setItem(DEMO_SAVED_WORDS_KEY, JSON.stringify(saved));
        return;
    }
    const response = await fetch("/api/saved-words", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, wordData }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "শব্দটি save হয়নি।");
}

function displays(display) {
    const btnContainer = document.getElementById("btn-container");
    const mobileContainer = document.getElementById("mobile-lesson-container");
    const mobileLabel = document.getElementById("mobile-current-lesson-label");
    const mobileCollapse = document.getElementById("mobile-lesson-collapse");

    btnContainer.innerHTML = "";  
    if (mobileContainer) mobileContainer.innerHTML = "";

    const levels = display.length ? display : [{ level_no: 1, fallback: true }];
    for (let dis of levels) {
        const title = dis.fallback ? "Lesson 1 · Beginner" : `Lesson-${dis.level_no}`;
        
        // Desktop / Tablet Button
        const btnDiv = document.createElement("div");
        btnDiv.innerHTML = `
            <button class="btn bg-white btn-outline btn-primary text-[#422AD5] hover:text-white hover:bg-[#422AD5]" data-level-no="${dis.level_no}">
                <i class="fa-solid fa-book-open"></i>${title}
            </button>
        `;
        if (dis.fallback) btnDiv.querySelector("button").dataset.topicNo = "1";
        
        const button = btnDiv.querySelector("button");
        const triggerLesson = () => {
            document.querySelectorAll("#btn-container button, #mobile-lesson-container button").forEach(btn => btn.classList.remove("active"));
            document.getElementById("nothing").style.display = "none";
            button.classList.add("active");
            if (mobileBtn) mobileBtn.classList.add("active");
            if (mobileLabel) mobileLabel.textContent = title;
            if (mobileCollapse) mobileCollapse.removeAttribute("open");
            if (dis.fallback) loadTopicLesson({ id: 1, title: "Lesson 1 · Beginner", difficulty: "সহজ", words: TOPIC_LESSONS[0].words });
            else loadLesson(dis.level_no);
        };
        button.addEventListener("click", triggerLesson);
        btnContainer.append(btnDiv);

        // Mobile Hamburger Dropdown Button
        let mobileBtn = null;
        if (mobileContainer) {
            mobileBtn = document.createElement("button");
            mobileBtn.type = "button";
            mobileBtn.className = "btn btn-sm bg-white btn-outline text-[#422AD5] hover:bg-[#422AD5] hover:text-white w-full text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 py-2";
            mobileBtn.dataset.levelNo = String(dis.level_no);
            mobileBtn.innerHTML = `<i class="fa-solid fa-book-open text-xs"></i> <span>${title}</span>`;
            mobileBtn.addEventListener("click", triggerLesson);
            mobileContainer.append(mobileBtn);
        }
    }

    for (const topic of TOPIC_LESSONS) {
        const triggerTopic = () => {
            document.querySelectorAll("#btn-container button, #mobile-lesson-container button").forEach(btn => btn.classList.remove("active"));
            document.getElementById("nothing").style.display = "none";
            button.classList.add("active");
            if (mobileBtn) mobileBtn.classList.add("active");
            if (mobileLabel) mobileLabel.textContent = topic.title;
            if (mobileCollapse) mobileCollapse.removeAttribute("open");
            loadTopicLesson(topic);
        };

        // Desktop
        const button = document.createElement("button");
        button.className = "btn bg-white btn-outline btn-primary text-[#422AD5] hover:bg-[#422AD5] hover:text-white";
        button.dataset.topicNo = String(topic.id);
        button.innerHTML = `<i class="fa-solid fa-layer-group" aria-hidden="true"></i>${escapeHTML(topic.title)}`;
        button.addEventListener("click", triggerTopic);
        btnContainer.append(button);

        // Mobile
        let mobileBtn = null;
        if (mobileContainer) {
            mobileBtn = document.createElement("button");
            mobileBtn.type = "button";
            mobileBtn.className = "btn btn-sm bg-white btn-outline text-[#422AD5] hover:bg-[#422AD5] hover:text-white w-full text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 py-2 col-span-2";
            mobileBtn.dataset.topicNo = String(topic.id);
            mobileBtn.innerHTML = `<i class="fa-solid fa-layer-group text-xs" aria-hidden="true"></i> <span>${escapeHTML(topic.title)}</span>`;
            mobileBtn.addEventListener("click", triggerTopic);
            mobileContainer.append(mobileBtn);
        }
    }

    const triggerSaved = () => {
        document.querySelectorAll("#btn-container button, #mobile-lesson-container button").forEach(btn => btn.classList.remove("active"));
        document.getElementById("nothing").style.display = "none";
        savedButton.classList.add("active");
        if (mobileSavedBtn) mobileSavedBtn.classList.add("active");
        if (mobileLabel) mobileLabel.textContent = "My Words";
        if (mobileCollapse) mobileCollapse.removeAttribute("open");
        loadSavedWords();
    };

    // Desktop
    const savedButton = document.createElement("button");
    savedButton.className = "btn bg-green-50 text-green-800 hover:bg-green-100";
    savedButton.dataset.savedWords = "true";
    savedButton.innerHTML = '<i class="fa-solid fa-bookmark" aria-hidden="true"></i>My Words';
    savedButton.addEventListener("click", triggerSaved);
    btnContainer.append(savedButton);

    // Mobile
    let mobileSavedBtn = null;
    if (mobileContainer) {
        mobileSavedBtn = document.createElement("button");
        mobileSavedBtn.type = "button";
        mobileSavedBtn.className = "btn btn-sm bg-green-50 text-green-800 hover:bg-green-100 w-full text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 py-2 col-span-2";
        mobileSavedBtn.dataset.savedWords = "true";
        mobileSavedBtn.innerHTML = '<i class="fa-solid fa-bookmark text-xs" aria-hidden="true"></i> <span>My Words</span>';
        mobileSavedBtn.addEventListener("click", triggerSaved);
        mobileContainer.append(mobileSavedBtn);
    }

    if (window.pendingDefaultLesson) {
        const defaultButton = btnContainer.querySelector(`button[data-level-no="${window.pendingDefaultLesson}"]`);
        if (defaultButton) {
            window.pendingDefaultLesson = null;
            defaultButton.click();
        }
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
    currentLessonNo = Number(id);

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
            currentLessonItems = data.data;
            data.data.forEach(item => wordCache.set(String(item.id), item));
            renderLessonItems();
        })
        .catch(error => console.error('Error fetching the lesson data:', error));
}

function renderLessonItems() {
    const container = document.getElementById("word-div");
    container.replaceChildren();
    if (!currentLessonItems.length) return;
    currentLessonItems.forEach(item => {
        const id = String(item.id);
        const wrapper = document.createElement("div");
        wrapper.dataset.wordId = id;
        wrapper.dataset.search = `${item.word || ""} ${item.meaning || ""} ${item.pronunciation || ""}`.toLocaleLowerCase();
        const card = document.createElement("article");
        card.className = "card bg-white min-h-60 sm:min-h-64 h-full shadow-xs hover:shadow-md hover:bg-[#422AD508] transition-all border border-gray-100 flex flex-col justify-between rounded-2xl";
        if (completedWordIds.has(id)) card.classList.add("completed-card");
        
        const body = document.createElement("div");
        body.className = "card-body p-4 sm:p-6 flex flex-col justify-between";

        // Top Centered Word (First letter Capitalized, clean without sub-badge)
        const headerDiv = document.createElement("div");
        headerDiv.className = "text-center mb-3 sm:mb-4";

        const rawWord = String(item.word || "").trim();
        const capitalizedWord = rawWord ? rawWord.charAt(0).toUpperCase() + rawWord.slice(1) : "";

        const word = document.createElement("h2");
        word.className = "text-xl sm:text-2xl font-bold text-gray-800 tracking-wide";
        word.textContent = capitalizedWord;

        headerDiv.append(word);

        // Two-column layout: Left = Meaning, Right = Pronunciation
        const columnsDiv = document.createElement("div");
        columnsDiv.className = "grid grid-cols-2 gap-2 sm:gap-3 text-center my-auto py-2 border-y border-gray-100/80";

        // Left Column (Meaning)
        const leftCol = document.createElement("div");
        leftCol.className = "flex flex-col items-center justify-center p-2 rounded-lg bg-[#F8F9FD]";
        const meaningTitle = document.createElement("p");
        meaningTitle.className = "text-xs font-bold uppercase tracking-wider text-gray-500 mb-1";
        meaningTitle.textContent = "Meaning";
        const meaningVal = document.createElement("p");
        meaningVal.className = "text-base font-semibold text-gray-800 line-clamp-2 leading-snug";
        meaningVal.textContent = item.meaning ? item.meaning : "—";
        meaningVal.title = item.meaning || "";
        leftCol.append(meaningTitle, meaningVal);

        // Right Column (Pronunciation)
        const rightCol = document.createElement("div");
        rightCol.className = "flex flex-col items-center justify-center p-2 rounded-lg bg-[#F8F9FD]";
        const pronTitle = document.createElement("p");
        pronTitle.className = "text-xs font-bold uppercase tracking-wider text-gray-500 mb-1";
        pronTitle.textContent = "Pronunciation";
        
        const pronText = (item.pronunciation || "").trim();
        if (pronText) {
            const pronVal = document.createElement("p");
            pronVal.className = "text-base font-semibold text-[#422AD5] line-clamp-2 leading-snug";
            pronVal.textContent = pronText;
            pronVal.title = pronText;
            rightCol.append(pronTitle, pronVal);
        } else {
            const listenBtn = document.createElement("button");
            listenBtn.type = "button";
            listenBtn.className = "btn btn-xs btn-ghost text-[#422AD5] gap-1 font-semibold hover:bg-blue-100/60";
            listenBtn.innerHTML = '<i class="fa-solid fa-volume-high text-xs"></i> <span>শুনুন</span>';
            listenBtn.title = "উচ্চারণ শুনতে ক্লিক করুন";
            listenBtn.addEventListener("click", () => item.dictionary ? playDictionaryAudio(item) : speakWord(item.word));
            rightCol.append(pronTitle, listenBtn);
        }

        columnsDiv.append(leftCol, rightCol);

        // Bottom Actions: Left = Info Button, Right = Sound Button
        const actions = document.createElement("div");
        actions.className = "card-actions flex justify-between items-center mt-4 pt-2";

        const info = document.createElement("button");
        info.type = "button";
        info.className = "btn btn-square btn-outline btn-sm text-gray-600 hover:bg-[#422AD5] hover:text-white hover:border-[#422AD5] transition-all";
        info.setAttribute("aria-label", `${item.word} এর বিস্তারিত`);
        info.title = "শব্দের বিস্তারিত দেখুন";
        info.innerHTML = '<i class="fa-solid fa-circle-info text-base" aria-hidden="true"></i>';

        const sound = document.createElement("button");
        sound.type = "button";
        sound.className = "btn btn-square btn-outline btn-sm text-gray-600 hover:bg-[#422AD5] hover:text-white hover:border-[#422AD5] transition-all";
        sound.setAttribute("aria-label", `${item.word} উচ্চারণ শুনুন`);
        sound.title = "শব্দের উচ্চারণ শুনুন";
        sound.innerHTML = '<i class="fa-solid fa-volume-high text-base" aria-hidden="true"></i>';

        info.addEventListener("click", () => fetchWords(item.id, card, currentLessonNo));
        sound.addEventListener("click", () => item.dictionary ? playDictionaryAudio(item) : speakWord(item.word));

        actions.append(info);

        if (item.dictionary && item.inSavedList) {
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "btn btn-sm btn-outline text-red-700 text-xs px-2";
            remove.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i> Remove';
            remove.addEventListener("click", async () => {
                remove.disabled = true;
                try {
                    if (activeUser?.isDemo) {
                        const saved = JSON.parse(localStorage.getItem(DEMO_SAVED_WORDS_KEY) || "[]").filter(row => row.word_id !== item.id);
                        localStorage.setItem(DEMO_SAVED_WORDS_KEY, JSON.stringify(saved));
                    } else {
                        const response = await fetch(`/api/saved-words?word=${encodeURIComponent(item.word)}`, { method: "DELETE" });
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.error || "শব্দ সরানো যায়নি।");
                    }
                    loadSavedWords();
                } catch (error) {
                    remove.disabled = false;
                    Swal.fire({ icon: "error", title: "শব্দ সরানো যায়নি", text: error.message });
                }
            });
            actions.append(remove);
        }

        actions.append(sound);

        body.append(headerDiv, columnsDiv, actions);
        card.append(body);
        wrapper.append(card);
        container.append(wrapper);
    });
    applyWordFilters();
}

const speakWord = (word) => {
    if (!("speechSynthesis" in window)) {
        console.error("Speech synthesis is not supported in this browser.");
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    const englishVoice = window.speechSynthesis.getVoices().find(voice =>
        voice.lang.toLowerCase().startsWith("en-us")
    );
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.speak(utterance);
}

function playDictionaryAudio(item) {
    const audioUrl = item?.dictionary?.audio;
    if (!audioUrl) return speakWord(item?.word || "");
    const audio = new Audio(audioUrl);
    audio.play().catch(() => speakWord(item.word));
}

const makePracticeCard = ({ speaker, english, bengali }) => {
    const card = document.createElement("article");
    card.className = "rounded-lg border border-gray-200 bg-white p-3 text-left";

    if (speaker) {
        const speakerLabel = document.createElement("p");
        speakerLabel.className = "mb-1 text-sm font-bold text-[#422AD5]";
        speakerLabel.textContent = speaker;
        card.append(speakerLabel);
    }

    const englishLine = document.createElement("p");
    englishLine.className = "font-medium";
    englishLine.textContent = english;

    const bengaliLine = document.createElement("p");
    bengaliLine.className = "mt-1 text-gray-600";
    bengaliLine.textContent = bengali;

    const listenButton = document.createElement("button");
    listenButton.type = "button";
    listenButton.className = "btn btn-sm mt-2";
    listenButton.setAttribute("aria-label", "Listen to this English sentence");
    listenButton.innerHTML = '<i class="fa-solid fa-volume-high" aria-hidden="true"></i> শুনুন';
    listenButton.addEventListener("click", () => speakWord(english));

    card.append(englishLine, bengaliLine, listenButton);
    return card;
}

const renderWordChips = (container, words, emptyMessage) => {
    if (!container) return;
    const uniqueWords = [...new Set((Array.isArray(words) ? words : []).filter(word => typeof word === "string" && word.trim()))];
    if (!uniqueWords.length) {
        container.textContent = emptyMessage;
        return;
    }

    const chips = uniqueWords.map(word => {
        const chip = document.createElement("span");
        chip.className = "rounded-full bg-[#EDF7FF] px-3 py-1 text-sm";
        chip.textContent = word;
        return chip;
    });
    container.replaceChildren(...chips);
}

const loadWordPractice = async (wordData) => {
    const sentencesContainer = document.getElementById("generated-sentences");
    const conversationContainer = document.getElementById("generated-conversation");
    const sourceTranslationContainer = document.getElementById("source-example-translation");
    const antonymContainer = document.getElementById("antonym-buttons-container");
    if (!sentencesContainer || !conversationContainer) return;

    const params = new URLSearchParams({
        word: wordData.word || "",
        meaning: wordData.meaning || "",
        pronunciation: wordData.pronunciation || "",
        example: wordData.sentence || "",
    });

    try {
        const response = await fetch(`/api/learning-content?${params}`);
        const content = await response.json();
        if (!response.ok) throw new Error(content.error || "অনুশীলনের বাক্য আনা যায়নি।");

        if (sourceTranslationContainer && content.originalExampleBengali) {
            sourceTranslationContainer.textContent = `বাংলা: ${content.originalExampleBengali}`;
        }
        renderWordChips(antonymContainer, [...(Array.isArray(wordData.antonyms) ? wordData.antonyms : []), ...(content.antonyms || [])], "এই অর্থে পরিচিত বিপরীত শব্দ নেই।");
        sentencesContainer.replaceChildren(...content.sentences.map(makePracticeCard));
        conversationContainer.replaceChildren(...content.conversation.map(makePracticeCard));
    } catch (error) {
        const message = document.createElement("p");
        message.className = "text-sm text-red-700";
        message.textContent = error instanceof TypeError
            ? "Backend-এ সংযোগ হচ্ছে না। npm run dev চালু আছে কি না দেখুন।"
            : error.message || "অনুশীলনের বাক্য আনা যায়নি।";
        sentencesContainer.replaceChildren(message);
        conversationContainer.replaceChildren();
        renderWordChips(antonymContainer, wordData.antonyms, "বিপরীত শব্দ আনা যায়নি।");
        if (sourceTranslationContainer && !sourceTranslationContainer.textContent.trim()) {
            sourceTranslationContainer.textContent = "স্বয়ংক্রিয় বাংলা অনুবাদ পাওয়া যায়নি।";
        }
    }
}

const showDictionaryDetails = (item, lessonNo) => {
    const modal = document.getElementById("my_modal_1");
    const entry = item.dictionary;
    const definitions = entry.meanings.flatMap(meaning => meaning.definitions.map(definition => ({ ...definition, partOfSpeech: meaning.partOfSpeech })));
    const example = definitions.find(definition => definition.example)?.example || "";
    const modalBox = document.createElement("div"); modalBox.className = "modal-box text-left";
    modalBox.innerHTML = `
        <div class="flex items-start justify-between gap-3">
            <div><h2 class="text-2xl font-bold">${escapeHTML(entry.word)}</h2><p class="text-gray-600">${escapeHTML(item.pronunciation || entry.phonetic || "উচ্চারণ দেওয়া নেই")}</p><p class="mt-1 text-sm text-[#422AD5] font-medium">${escapeHTML(item.meaning || "Vocabulary")}</p></div>
            <div class="flex flex-col gap-2">
                ${entry.audio ? `<audio controls preload="none" class="max-w-48"><source src="${escapeHTML(entry.audio)}" type="audio/mpeg"></audio>` : `<button type="button" id="dict-speak" class="btn btn-square" aria-label="উচ্চারণ শুনুন"><i class="fa-solid fa-volume-high" aria-hidden="true"></i></button>`}
                <button type="button" id="dict-close-top" class="btn btn-sm">বন্ধ</button>
            </div>
        </div>
        <details class="collapse collapse-arrow bg-[#EDF7FF] mt-4 rounded-lg border border-blue-100" open>
            <summary class="collapse-title font-bold text-gray-800 flex items-center gap-2 cursor-pointer">
                <span>অর্থ ও ব্যবহার</span>
                <span class="text-xs text-[#422AD5] font-normal">(ক্লিক করে লুকান / দেখুন)</span>
            </summary>
            <div class="collapse-content">
                <div id="dictionary-definitions" class="mt-1 space-y-2.5"></div>
            </div>
        </details>
        ${example ? `<section class="mt-3 rounded-lg border border-gray-200 p-4"><h3 class="font-bold">উদাহরণ</h3><p>${escapeHTML(example)}</p><p class="mt-2 text-sm text-gray-600">নিচে AI practice-এ বাংলা অনুবাদও পাওয়া যাবে।</p></section>` : ""}
        <section class="mt-4 rounded-lg bg-[#F8F8FC] p-4"><h3 class="font-bold">এই শব্দ দিয়ে ৩টি বাক্য ও কথোপকথন</h3><div id="generated-sentences" class="mt-2 space-y-2"><p class="text-sm text-gray-600">অনুশীলন তৈরি হচ্ছে…</p></div><h3 class="mt-5 font-bold">ছোট কথোপকথন</h3><div id="generated-conversation" class="mt-2 space-y-2"></div></section>
        <section class="mt-4"><h3 class="font-bold">সমার্থক শব্দ</h3><div id="synonym-buttons-container" class="mt-1 flex flex-wrap gap-2"></div></section>
        <section class="mt-3"><h3 class="font-bold">বিপরীত শব্দ</h3><div id="antonym-buttons-container" class="mt-1 flex flex-wrap gap-2"></div></section>
        <div class="modal-action flex flex-wrap justify-end gap-2"><button type="button" id="cancel-learning-button" class="btn">Cancel</button><button type="button" id="save-dictionary-button" class="btn btn-outline">Save word</button><button type="button" id="complete-learning-button" class="btn bg-[#422AD5] px-4 text-white">Complete Learning</button></div>`;
    modal.replaceChildren(modalBox); if (!modal.open) modal.showModal();
    const definitionsContainer = modalBox.querySelector("#dictionary-definitions");
    definitions.slice(0, 3).forEach(definition => {
        const row = document.createElement("article"); row.className = "border-b border-blue-200/50 pb-2 last:border-0 last:pb-0";
        const pos = document.createElement("p"); pos.className = "text-xs font-semibold uppercase text-[#422AD5]"; pos.textContent = definition.partOfSpeech;
        const text = document.createElement("p"); text.textContent = definition.definition;
        row.append(pos, text); definitionsContainer.append(row);
    });
    const synonyms = [...new Set(definitions.flatMap(definition => definition.synonyms || []))].slice(0, 12);
    renderWordChips(modalBox.querySelector("#synonym-buttons-container"), synonyms, "তথ্য নেই");
    renderWordChips(modalBox.querySelector("#antonym-buttons-container"), [...new Set(definitions.flatMap(definition => definition.antonyms || []))], "তথ্য নেই");
    modalBox.querySelector("#dict-speak")?.addEventListener("click", () => playDictionaryAudio(item));
    modalBox.querySelector("#dict-close-top").addEventListener("click", closeModal);
    modalBox.querySelector("#cancel-learning-button").addEventListener("click", closeModal);
    modalBox.querySelector("#save-dictionary-button").addEventListener("click", async event => {
        const button = event.currentTarget; button.disabled = true;
        try { await saveDictionaryWord(item, item.topic || "My words"); button.textContent = "Saved ✓"; }
        catch (error) { button.disabled = false; Swal.fire({ icon: "error", title: "শব্দ save হয়নি", text: error.message }); }
    });
    modalBox.querySelector("#complete-learning-button").addEventListener("click", async event => {
        const button = event.currentTarget; button.disabled = true;
        try { await saveDictionaryWord(item, item.topic || "My words"); await saveCompletedWord(item.id, lessonNo); closeModal(); }
        catch (error) { button.disabled = false; Swal.fire({ icon: "error", title: "শেখা সম্পন্ন হয়নি", text: error.message }); }
    });
    loadWordPractice({ word: item.word, meaning: item.meaning, pronunciation: item.pronunciation, sentence: example, synonyms, antonyms: item.antonyms });
};

const fetchWords = (wordId, cardElement, lessonNo) => {
    const cachedItem = wordCache.get(String(wordId));
    if (cachedItem?.dictionary) return showDictionaryDetails(cachedItem, lessonNo);
    const modal = document.getElementById("my_modal_1");
    modal.innerHTML = `
        <div class="modal-box text-center">
            <span class="loading loading-dots loading-lg"></span>
            <p>শব্দের তথ্য লোড হচ্ছে...</p>
        </div>
    `;
    if (!modal.open) modal.showModal();

    fetch(`https://openapi.programming-hero.com/api/word/${wordId}`)
        .then(response => {
            if (!response.ok) throw new Error(`Request failed (${response.status})`);
            return response.json();
        })
        .then(data => {
            if (!data.data) {
                modal.innerHTML = `<div class="modal-box"><p>এই শব্দের তথ্য পাওয়া যায়নি।</p><div class="modal-action"><button class="btn" onclick="closeModal()">বন্ধ করুন</button></div></div>`;
                return;
            }

            modal.innerHTML = "";  

            const exampleSentence = data.data.sentence || "";
            const exampleTranslation = data.data.sentence_meaning || data.data.sentenceMeaning || data.data.sentence_translation;
            const diadiv = document.createElement("div");
            diadiv.className = "modal-box";
            diadiv.innerHTML = `
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-2xl font-bold">${escapeHTML(data.data.word)}</h2>
                        <p class="text-gray-600"><i class="fa-solid fa-microphone-lines" aria-hidden="true"></i> ${escapeHTML(data.data.pronunciation || "উচ্চারণ দেওয়া নেই")}</p>
                    </div>
                    <button type="button" id="modal-pronunciation-button" class="btn btn-square" aria-label="Listen to ${escapeHTML(data.data.word)}" title="শব্দটির উচ্চারণ শুনুন">
                        <i class="fa-solid fa-volume-high" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="mt-4 space-y-4">
                    <section class="rounded-lg bg-[#EDF7FF] p-4">
                        <h3 class="font-bold">বাংলা অর্থ</h3>
                        <p>${escapeHTML(data.data.meaning || "অর্থ পাওয়া যায়নি")}</p>
                    </section>
                    <section class="rounded-lg border border-gray-200 p-4">
                        <h3 class="font-bold">উদাহরণ</h3>
                        <p>${escapeHTML(exampleSentence || "উদাহরণ দেওয়া নেই")}</p>
                        ${exampleSentence ? `<p id="source-example-translation" class="mt-2 text-gray-600">${exampleTranslation ? `বাংলা: ${escapeHTML(exampleTranslation)}` : "বাংলা অনুবাদ তৈরি হচ্ছে..."}</p>` : ""}
                    </section>
                    <section class="rounded-lg bg-[#F8F8FC] p-4">
                        <h3 class="font-bold">এই শব্দ দিয়ে ৩টি বাক্য</h3>
                        <div id="generated-sentences" class="mt-2 space-y-2">
                            <p class="text-sm text-gray-600">AI থেকে বাক্য তৈরি হচ্ছে...</p>
                        </div>
                        <h3 class="mt-5 font-bold">ছোট কথোপকথন</h3>
                        <div id="generated-conversation" class="mt-2 space-y-2">
                            <p class="text-sm text-gray-600">কথোপকথন তৈরি হচ্ছে...</p>
                        </div>
                    </section>
                    <section>
                        <h3 class="font-bold">সমার্থক শব্দ</h3>
                        <div id="synonym-buttons-container" class="mt-1 flex flex-wrap gap-2"></div>
                    </section>
                    <section>
                        <h3 class="font-bold">বিপরীত শব্দ</h3>
                        <div id="antonym-buttons-container" class="mt-1 flex flex-wrap gap-2">বিপরীত শব্দ খোঁজা হচ্ছে...</div>
                    </section>
                </div>
                <div class="modal-action flex flex-wrap justify-end gap-2">
                    <button type="button" id="cancel-learning-button" class="btn">Cancel</button>
                    <button type="button" id="complete-learning-button" class="btn px-4 text-white bg-[#422AD5]">Complete Learning</button>
                </div>
            `;

            diadiv.querySelector("#modal-pronunciation-button").addEventListener("click", () => speakWord(data.data.word));
            diadiv.querySelector("#cancel-learning-button").addEventListener("click", closeModal);
            diadiv.querySelector("#complete-learning-button").addEventListener("click", () => {
                saveCompletedWord(wordId, lessonNo);
                closeModal();
            });
            
            const synonymContainer = diadiv.querySelector("#synonym-buttons-container");
            if (data.data.synonyms?.length) {
                data.data.synonyms.forEach((synonym) => {
                    const chip = document.createElement("span");
                    chip.className = "rounded-full bg-[#EDF7FF] px-3 py-1 text-sm";
                    chip.textContent = synonym;
                    synonymContainer.appendChild(chip);
                });
            } else {
                synonymContainer.innerHTML = "দুঃখিত!";
            }
            renderWordChips(diadiv.querySelector("#antonym-buttons-container"), data.data.antonyms, "বিপরীত শব্দ খোঁজা হচ্ছে...");
            modal.append(diadiv);
            loadWordPractice(data.data);
        })
        .catch(error => {
            console.error("Error fetching word details:", error);
            modal.innerHTML = `
                <div class="modal-box">
                    <h2 class="text-lg font-bold">শব্দের তথ্য আনা যায়নি</h2>
                    <p class="mt-2">ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।</p>
                    <div class="modal-action"><button class="btn" onclick="closeModal()">বন্ধ করুন</button></div>
                </div>
            `;
        });
}

const closeModal = () => {
    document.getElementById("my_modal_1").close();
}

async function saveCompletedWord(wordId, lessonNo) {
    if (!activeUser) return;
    try {
        if (activeUser.isDemo) {
            if (!completedWordIds.has(String(wordId))) {
                completedWordRows.push({ word_id: String(wordId), lesson_no: Number(lessonNo), completed_at: new Date().toISOString(), review_due_at: new Date(Date.now() + 86400000).toISOString(), review_stage: 0, quiz_correct: 0, quiz_attempts: 0 });
                completedWordIds.add(String(wordId));
                localStorage.setItem(DEMO_PROGRESS_KEY, JSON.stringify({ completedWords: completedWordRows }));
                const activities = JSON.parse(localStorage.getItem(DEMO_ACTIVITY_KEY) || "[]");
                activities.push({ date: new Date().toISOString().slice(0, 10), event_type: "word_completed" });
                localStorage.setItem(DEMO_ACTIVITY_KEY, JSON.stringify(activities));
            }
            await refreshDashboard();
            renderLessonItems();
            return;
        }
        const response = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wordId, lessonNo }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Progress save failed");
        if (!completedWordIds.has(String(wordId))) completedWordIds.add(String(wordId));
        await Promise.all([loadProgress(), refreshDashboard()]);
        renderLessonItems();
    } catch (error) {
        Swal.fire({ icon: "error", title: "Progress save হয়নি", text: error.message });
    }
}

window.startLearningSession = async function (user) {
    activeUser = user;
    document.getElementById("user-display").textContent = user?.name ? `• ${user.name}` : "";
    document.getElementById("learning-app").classList.remove("hidden");
    document.getElementById("cards").style.display = "block";
    document.getElementById("section-question").style.display = "block";
    document.getElementById("header").style.display = "block";
    document.getElementById("baner-1").style.display = "none";
    document.getElementById("footer").style.display = "block";
    try {
        const [settingsResponse] = await Promise.all([fetch("/api/settings"), loadProgress()]);
        if (settingsResponse.ok) dailyGoal = (await settingsResponse.json()).dailyGoal || 5;
    } catch (error) {
        Swal.fire({ icon: "error", title: "Progress load হয়নি", text: error.message });
    }
    const lessonOne = document.querySelector('#btn-container button[data-level-no="1"]');
    if (lessonOne) lessonOne.click();
    else window.pendingDefaultLesson = 1;
    refreshDashboard();
};

window.startDemoSession = async function () {
    activeUser = { name: "Judge Demo", isDemo: true };
    document.getElementById("user-display").textContent = "• Judge Demo (Demo)";
    document.getElementById("learning-app").classList.remove("hidden");
    document.getElementById("cards").style.display = "block";
    document.getElementById("section-question").style.display = "block";
    document.getElementById("header").style.display = "block";
    document.getElementById("baner-1").style.display = "none";
    document.getElementById("footer").style.display = "block";
    dailyGoal = Number(localStorage.getItem(DEMO_GOAL_KEY)) || 5;
    await loadProgress();
    const lessonOne = document.querySelector('#btn-container button[data-level-no="1"]');
    if (lessonOne) lessonOne.click(); else window.pendingDefaultLesson = 1;
    await refreshDashboard();
};

async function refreshDashboard() {
    try {
        if (activeUser?.isDemo) {
            const activity = JSON.parse(localStorage.getItem(DEMO_ACTIVITY_KEY) || "[]");
            const today = new Date().toISOString().slice(0, 10);
            const activeDays = [...new Set(activity.map(item => item.date))].sort().reverse();
            let streak = 0; const cursor = new Date(`${today}T00:00:00Z`);
            if (!activeDays.includes(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
            for (const day of activeDays) { if (day !== cursor.toISOString().slice(0, 10)) break; streak++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
            const quizAttempts = activity.filter(item => item.event_type === "quiz_attempt");
            const dueCount = completedWordRows.filter(item => item.review_due_at && item.review_due_at <= new Date().toISOString()).length;
            const completedToday = activity.filter(item => item.date === today && item.event_type === "word_completed").length;
            document.getElementById("stat-words").textContent = completedWordRows.length;
            document.getElementById("stat-goal").textContent = `${completedToday} / ${dailyGoal}`;
            document.getElementById("stat-streak").textContent = `${streak} দিন`;
            document.getElementById("stat-due").textContent = dueCount;
            document.getElementById("stat-quiz").textContent = quizAttempts.length ? `${Math.round(quizAttempts.filter(item => item.correct).length / quizAttempts.length * 100)}%` : "—";
            document.getElementById("goal-progress").style.width = `${Math.min(100, completedToday / dailyGoal * 100)}%`;
            document.getElementById("set-goal-button").textContent = `দৈনিক লক্ষ্য: ${dailyGoal}`;
            document.getElementById("dashboard-message").textContent = `Demo mode · ${new Set(completedWordRows.map(item => item.lesson_no)).size}টি Lesson থেকে শিখছেন।`;
            return;
        }
        const response = await fetch("/api/dashboard");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Dashboard পাওয়া যায়নি।");
        document.getElementById("stat-words").textContent = data.completedWords;
        document.getElementById("stat-goal").textContent = `${data.completedToday} / ${dailyGoal}`;
        document.getElementById("stat-streak").textContent = `${data.streak} দিন`;
        document.getElementById("stat-due").textContent = data.dueCount;
        document.getElementById("stat-quiz").textContent = data.quizAttempts ? `${Math.round(data.quizCorrect / data.quizAttempts * 100)}%` : "—";
        document.getElementById("goal-progress").style.width = `${Math.min(100, data.completedToday / dailyGoal * 100)}%`;
        document.getElementById("set-goal-button").textContent = `দৈনিক লক্ষ্য: ${dailyGoal}`;
        document.getElementById("dashboard-message").textContent = `${data.lessons}টি Lesson থেকে শিখছেন। আজ আরও ${Math.max(0, dailyGoal - data.completedToday)}টি শব্দ সম্পন্ন করুন।`;
    } catch (error) {
        document.getElementById("dashboard-message").textContent = error.message;
    }
}

async function loadKnownWords() {
    await loadProgress();
    let savedRows = [];
    if (activeUser?.isDemo) savedRows = JSON.parse(localStorage.getItem(DEMO_SAVED_WORDS_KEY) || "[]");
    else {
        const response = await fetch("/api/saved-words"); const result = await response.json();
        if (response.ok) savedRows = result.words || [];
    }
    const savedById = new Map(savedRows.map(row => [String(row.word_id), row.word_data]));
    const lessonNos = [...new Set(completedWordRows.map(row => Number(row.lesson_no)).filter(level => level <= 10))];
    const responses = await Promise.all(lessonNos.map(level => fetch(`https://openapi.programming-hero.com/api/level/${level}`).then(res => res.json()).catch(() => ({ data: [] }))));
    const byId = new Map();
    for (const response of responses) for (const item of response.data || []) byId.set(String(item.id), item);
    return completedWordRows.map(row => ({ ...byId.get(String(row.word_id)), ...savedById.get(String(row.word_id)), ...row, word_id: String(row.word_id) })).filter(item => item.word && item.meaning);
}

function shuffle(items) { return [...items].sort(() => Math.random() - 0.5); }

function showPanel(panelId) {
    for (const id of ["dashboard", "quiz-panel", "review-panel"]) document.getElementById(id).classList.add("hidden");
    document.getElementById(panelId).classList.remove("hidden");
    document.getElementById(panelId).scrollIntoView({ behavior: "smooth", block: "start" });
}

async function startQuiz() {
    try {
        const words = await loadKnownWords();
        if (words.length < 2) throw new Error("Quiz শুরু করতে আগে অন্তত ২টি শব্দ Complete Learning করুন।");
        quizQueue = shuffle(words).slice(0, Math.min(words.length, 10)); quizIndex = 0;
        showPanel("quiz-panel"); renderQuizQuestion();
    } catch (error) { Swal.fire({ icon: "info", title: "Quiz প্রস্তুত নয়", text: error.message }); }
}

function renderQuizQuestion() {
    const word = quizQueue[quizIndex];
    if (!word) {
        document.getElementById("quiz-card").textContent = "Quiz শেষ! আপনার progress dashboard-এ আপডেট হয়েছে।";
        document.getElementById("quiz-actions").replaceChildren(); document.getElementById("quiz-next").classList.add("hidden");
        refreshDashboard(); return;
    }
    document.getElementById("quiz-progress-label").textContent = `প্রশ্ন ${quizIndex + 1} / ${quizQueue.length}`;
    document.getElementById("quiz-feedback").textContent = "";
    document.getElementById("quiz-card").textContent = `“${word.word}” শব্দটির সঠিক বাংলা অর্থ কোনটি?`;
    const choices = shuffle([word.meaning, ...shuffle(quizQueue.filter(item => item.word_id !== word.word_id).map(item => item.meaning)).slice(0, 3)]);
    const actions = document.getElementById("quiz-actions"); actions.replaceChildren();
    for (const choice of [...new Set(choices)]) {
        const button = document.createElement("button"); button.className = "btn btn-outline"; button.textContent = choice;
        button.addEventListener("click", async () => {
            actions.querySelectorAll("button").forEach(item => item.disabled = true);
            const correct = choice === word.meaning;
            document.getElementById("quiz-feedback").textContent = correct ? "সঠিক উত্তর!" : `সঠিক উত্তর: ${word.meaning}`;
            document.getElementById("quiz-feedback").className = `min-h-8 text-center font-semibold ${correct ? "text-green-700" : "text-red-600"}`;
            try {
                await submitReview(word.word_id, correct);
                document.getElementById("quiz-next").classList.remove("hidden");
            } catch (error) {
                document.getElementById("quiz-feedback").textContent = error.message;
                actions.querySelectorAll("button").forEach(item => item.disabled = false);
            }
        }); actions.append(button);
    }
}

async function submitReview(wordId, correct) {
    if (activeUser?.isDemo) {
        const row = completedWordRows.find(item => String(item.word_id) === String(wordId));
        if (!row) throw new Error("Demo শব্দের progress পাওয়া যায়নি।");
        const stage = correct ? Math.min((row.review_stage || 0) + 1, 4) : 0;
        const days = [1, 3, 7, 14, 30][stage];
        row.review_stage = stage; row.last_reviewed_at = new Date().toISOString(); row.review_due_at = new Date(Date.now() + days * 86400000).toISOString();
        row.quiz_attempts = (row.quiz_attempts || 0) + 1; row.quiz_correct = (row.quiz_correct || 0) + Number(correct);
        localStorage.setItem(DEMO_PROGRESS_KEY, JSON.stringify({ completedWords: completedWordRows }));
        const activity = JSON.parse(localStorage.getItem(DEMO_ACTIVITY_KEY) || "[]");
        activity.push({ date: new Date().toISOString().slice(0, 10), event_type: "quiz_attempt", correct });
        localStorage.setItem(DEMO_ACTIVITY_KEY, JSON.stringify(activity));
        return;
    }
    const response = await fetch("/api/progress/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wordId, correct }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "উত্তর সংরক্ষণ হয়নি।");
}

async function startRevision() {
    try {
        const words = await loadKnownWords(); const now = Date.now();
        reviewQueue = shuffle(words.filter(item => !item.review_due_at || Date.parse(item.review_due_at) <= now)); reviewIndex = 0;
        if (!reviewQueue.length) throw new Error("এখন কোনো শব্দ Revision-এর জন্য বাকি নেই।");
        showPanel("review-panel"); renderReviewCard();
    } catch (error) { Swal.fire({ icon: "info", title: "Revision প্রস্তুত নয়", text: error.message }); }
}

function renderReviewCard() {
    const word = reviewQueue[reviewIndex];
    document.getElementById("review-count").textContent = word ? `${reviewIndex + 1} / ${reviewQueue.length} শব্দ` : "আজকের Revision শেষ!";
    const card = document.getElementById("review-card"); const actions = document.getElementById("review-actions"); actions.replaceChildren();
    if (!word) { card.textContent = "দারুণ! আজকের Revision শেষ করেছেন।"; refreshDashboard(); return; }
    card.textContent = `“${word.word}”`;
    const reveal = document.createElement("button"); reveal.className = "btn btn-primary"; reveal.textContent = "অর্থ দেখুন";
    reveal.addEventListener("click", () => {
        card.textContent = `${word.word} — ${word.meaning}`; actions.replaceChildren();
        for (const [label, correct] of [["মনে ছিল", true], ["আবার শিখব", false]]) {
            const button = document.createElement("button"); button.className = "btn btn-outline"; button.textContent = label;
            button.addEventListener("click", async () => {
                button.disabled = true;
                try { await submitReview(word.word_id, correct); reviewIndex++; renderReviewCard(); }
                catch (error) { button.disabled = false; Swal.fire({ icon: "error", title: "Revision save হয়নি", text: error.message }); }
            }); actions.append(button);
        }
    }); actions.append(reveal);
}

document.getElementById("word-search").addEventListener("input", applyWordFilters);
document.getElementById("word-filter").addEventListener("change", applyWordFilters);
document.getElementById("dictionary-search-form").addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("word-search");
    const query = input.value.trim();
    if (query) {
        searchDictionaryWord(query);
    }
});
document.getElementById("dashboard-nav").addEventListener("click", () => { refreshDashboard(); showPanel("dashboard"); });
document.getElementById("quiz-nav").addEventListener("click", startQuiz);
document.getElementById("review-nav").addEventListener("click", startRevision);
for (const id of ["close-dashboard", "quiz-close", "review-close"]) document.getElementById(id).addEventListener("click", () => document.getElementById(id === "close-dashboard" ? "dashboard" : id === "quiz-close" ? "quiz-panel" : "review-panel").classList.add("hidden"));
document.getElementById("quiz-next").addEventListener("click", () => { quizIndex++; renderQuizQuestion(); });
document.getElementById("set-goal-button").addEventListener("click", async () => {
    const value = Number(prompt("প্রতিদিন কয়টি নতুন শব্দ শেখার লক্ষ্য রাখবেন?", dailyGoal));
    if (Number.isInteger(value) && value >= 1 && value <= 100) {
        dailyGoal = value;
        localStorage.setItem(DEMO_GOAL_KEY, String(value));
        refreshDashboard();

        if (activeUser && !activeUser.isDemo) {
            try {
                const response = await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ dailyGoal: value })
                });
                if (response.ok) {
                    const result = await response.json();
                    dailyGoal = result.dailyGoal || value;
                    refreshDashboard();
                }
            } catch {
                // Network or session expired, already preserved in localStorage
            }
        }
        Swal.fire({ position: "center", icon: "success", title: "লক্ষ্য সংরক্ষিত হয়েছে", showConfirmButton: false, timer: 1200 });
    }
});

// Mobile Hamburger Menu Toggle & Actions
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenuDropdown = document.getElementById("mobile-menu-dropdown");

if (mobileMenuBtn && mobileMenuDropdown) {
    mobileMenuBtn.addEventListener("click", () => {
        mobileMenuDropdown.classList.toggle("hidden");
    });

    const closeMobileMenu = () => mobileMenuDropdown.classList.add("hidden");

    document.getElementById("mobile-scrollBtn")?.addEventListener("click", () => {
        closeMobileMenu();
        document.getElementById("scrollBtn")?.click();
    });

    document.getElementById("mobile-scrollBtn-2")?.addEventListener("click", () => {
        closeMobileMenu();
        document.getElementById("scrollBtn-2")?.click();
    });

    document.getElementById("mobile-dashboard-nav")?.addEventListener("click", () => {
        closeMobileMenu();
        document.getElementById("dashboard-nav")?.click();
    });

    document.getElementById("mobile-quiz-nav")?.addEventListener("click", () => {
        closeMobileMenu();
        document.getElementById("quiz-nav")?.click();
    });

    document.getElementById("mobile-review-nav")?.addEventListener("click", () => {
        closeMobileMenu();
        document.getElementById("review-nav")?.click();
    });

    document.getElementById("mobile-logout-button")?.addEventListener("click", () => {
        closeMobileMenu();
        document.getElementById("logout-button")?.click();
    });

    // Close when clicking outside
    document.addEventListener("click", event => {
        if (!mobileMenuBtn.contains(event.target) && !mobileMenuDropdown.contains(event.target)) {
            closeMobileMenu();
        }
    });
}

loadCategories();
