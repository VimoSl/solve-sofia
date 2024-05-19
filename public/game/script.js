const timerEl = document.querySelector(".timer");
const titleEl = document.querySelector(".title");
const taskEl = document.querySelector(".task");
const imgEl = document.querySelector(".img");
const inputEl = document.querySelector(".input");
const btnCheck = document.querySelector(".btn-ok");
const btnHelp = document.querySelector(".btn-help");
const textHelp = document.querySelector(".help-text");
const passHold = document.querySelector(".password-holder");
const btnStart = document.querySelector(".btn-start");
const passInp = document.querySelector(".pass-inp");
const pointEl = document.querySelector(".points");

let questions = questionsHard;

let currQuestionPonits;
let currAnswer;
let currHelp;
let timeStarted;
let timeEnded;
let questInd;
let key;
let usedHelp = false;
let currPoints = 0;

const handleWin = function () {
	document.querySelector(".timer-holder").classList.add("hidden");
	titleEl.classList.add("hidden");
	document.querySelector(".img-holder").classList.add("hidden");
	document.querySelector(".input-holder").classList.add("hidden");
	document.querySelector(".points").classList.add("hidden");
	document.querySelector(".help-holder").classList.add("hidden");
	document.querySelector(".task").classList.add("hidden");
	document.querySelector(".win-holder").classList.remove("hidden");
	document.querySelector(".pts-end").textContent = currPoints;
	const timeDiffInMs = timeEnded - timeStarted;
	document.querySelector(".time-end").textContent = Math.floor(timeDiffInMs / 1000 / 60);
};

const handleTimeIsUp = function () {
	document.querySelector(".timer-holder").classList.add("hidden");
	titleEl.classList.add("hidden");
	document.querySelector(".img-holder").classList.add("hidden");
	document.querySelector(".input-holder").classList.add("hidden");
	document.querySelector(".points").classList.add("hidden");
	document.querySelector(".help-holder").classList.add("hidden");
	document.querySelector(".task").classList.add("hidden");
	document.querySelector(".lose-holder").classList.remove("hidden");
	document.querySelectorAll(".pts-end")[1].textContent = currPoints;
};

const loadQuestion = function (id) {
	document.body.classList.add("inv");
	setTimeout(() => document.body.classList.remove("inv"), 600);
	setTimeout(() => {
		const asdf = questions.findIndex((el) => el.id == id);
		const { question, answer, diff, imgSrc, help } = questions[asdf];
		console.log(asdf, id);
		titleEl.textContent = `Задача ${questInd + 1}.`;
		taskEl.innerHTML = question;
		imgEl.setAttribute("src", imgSrc);
		currAnswer = answer;
		currHelp = help;
		currQuestionPonits = diff;
		pointEl.textContent = `Точки: ${currPoints}`;
		inputEl.value = "";
		if (!usedHelp) {
			btnHelp.classList.remove("hidden");
			textHelp.textContent = "";
		} else {
			btnHelp.classList.add("hidden");
			textHelp.textContent = currHelp;
		}
	}, 300);
};

const checkAnswer = async function (answer) {
	answer = answer.replaceAll(" ", "").toLowerCase().replaceAll(".", "");
	currAnswer = currAnswer.replaceAll(" ", "").toLowerCase().replaceAll(".", "");
	if (answer == currAnswer) {
		if (usedHelp) {
			currPoints += currQuestionPonits / 2;
		} else {
			currPoints += currQuestionPonits;
		}

		usedHelp = false;
		questInd++;
		if (questInd >= questions.length) {
			timeEnded = new Date();
			await fetch(`${window.location.origin}/finish-game`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					timeEnded: timeEnded.toISOString(),
					key,
				}),
			});
		}
		try {
			await fetch(`${window.location.origin}/next-question`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					points: currPoints,
					questInd,
					usedHelp: false,
					key,
				}),
			});
		} catch (err) {
			alert(err);
		}
		if (questInd < questions.length) {
			loadQuestion(questInd);
		} else {
			handleWin();
		}
	} else {
		btnCheck.classList.add("btn-red");
		setTimeout(() => btnCheck.classList.remove("btn-red"), 400);
	}
};

const updateTimer = function () {
	const currentTime = new Date();
	const timeDiffInMs = 7200000 - (currentTime - timeStarted);
	const hours = Math.floor(timeDiffInMs / 1000 / 60 / 60);
	const min = Math.floor((timeDiffInMs - 3600000 * hours) / 1000 / 60);
	const sec = Math.floor((timeDiffInMs - 3600000 * hours - 60000 * min) / 1000);
	if (timeDiffInMs < 0) {
		handleTimeIsUp();
		return true;
	}
	timerEl.textContent = `${hours.toString().padStart(2, "0")}:${min
		.toString()
		.padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
	return false;
};

const handleHelpClick = async function () {
	if (!confirm("Сигурни ли сте, че искате жокер?")) return;
	btnHelp.classList.add("hidden");
	textHelp.textContent = currHelp;

	try {
		await fetch(`${window.location.origin}/use-help`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				usedHelp: true,
				key,
			}),
		});
		usedHelp = true;

		// const msg = await update(ref(database, currTeam), {
		// 	usedHelp: true,
		// });
	} catch (err) {
		alert(err);
	}
};

const handleStartGame = async function () {
	const password = passInp.value;

	console.log(password, JSON.stringify(password));

	const ans = await fetch(`${window.location.origin}/check-pass`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			password,
		}),
	});

	const value = await ans.json();
	console.log(value);
	if (value.key === "wp") {
		btnStart.classList.add("btn-red");
		setTimeout(() => btnStart.classList.remove("btn-red"), 400);
		return;
	}
	// console.log(realValue);

	// currTeam = team;
	key = value.key;
	questInd = value.qInd;
	usedHelp = value.usedHelp;
	currPoints = value.points;
	timeStarted = new Date(value.timeStarted);
	timeEnded = new Date(value.timeEnded);

	//////////////////////////////////////////////////////////////////////////////
	passHold.classList.add("hidden");
	document.querySelector(".timer-holder").classList.remove("hidden");
	titleEl.classList.remove("hidden");
	document.querySelector(".img-holder").classList.remove("hidden");
	document.querySelector(".input-holder").classList.remove("hidden");
	document.querySelector(".help-holder").classList.remove("hidden");
	let timeUp = updateTimer();
	if (timeUp) return;
	setInterval(updateTimer, 1000);
	//////////////////////////////////////////////////////////////////////////

	if (questInd < questions.length) {
		loadQuestion(questInd);
	} else {
		handleWin();
	}
};

btnCheck.addEventListener("click", () => checkAnswer(inputEl.value));
btnHelp.addEventListener("click", () => handleHelpClick());
btnStart.addEventListener("click", handleStartGame);

const test = async function () {
	currPoints = 10;
	qInd = 10;

	const res = await fetch(`${window.location.origin}/next-question`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			points: currPoints,
			qInd,
		}),
	});
};
