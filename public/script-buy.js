const btn = document.querySelector(".btn-buy-a-game");

btn.addEventListener("click", async () => {
	const res = await fetch(`${window.location.origin}/create-checkout-session`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			game: document.querySelector(".selected-game").dataset.game,
			diff: document.querySelector(".btn-selected").textContent === "Лесно" ? "easy" : "hard",
		}),
	});
	const body = await res.json();
	window.location.href = body.url;
});

document.querySelector(".buy-a-game-btn-holder").addEventListener("click", function (e) {
	console.log(e.target);
	if (!e.target.classList.contains("btn-diff")) return;

	document.querySelectorAll(".btn-diff").forEach((el) => el.classList.remove("btn-selected"));
	e.target.classList.add("btn-selected");
});

const games = [
	{
		gameId: "borisova",
		name: "Разгадай Борисовата градина",
		description: `Играта "Разгадай Борисовата градина" предлага един по-спокоен вариант за разгадаване на загадки в сърцето на един от най-красивите и посещавани паркове в София. Разстоянието, което участниците изминават по време на играта, е около 2 километра, което прави преживяването идеално за тези, които искат да съчетаят умствена активност с лека физическа разходка. Играта е с времеви лимит от 2 часа, но е възможно да бъде завършена и за по-кратко време, което я прави отличен избор за организиране на рожденни дни или просто за по-забавно и вълнуващо прекарване на времето в парка. Участниците ще имат възможността да открият скрити ъгълчета и малко известни факти за Борисовата градина, докато решават интригуващи загадки и разкриват тайни на различни точки в парка.`,
		imgSrc: "images/Borisova.jpg",
	},
	{
		gameId: "sofia-center",
		name: "Разгадай Центъра на София",
		description: `Играта "Разгадай Центъра на София" е идеален начин да изследвате сърцето на столицата по един нестандартен и забавен начин. Стартирайки около Софийския университет, тази игра ви води през иконичните места и забележителности на централната градска част на София, като разкрива истории и любопитни факти за всяка локация. Общата дължина на маршрута е около 4,5 километра, като играта предлага времеви лимит от 3 часа за завършване, което дава достатъчно време да се насладите на красотата на града, докато разгадавате всяка загадка. Тази игра е перфектна за любители на градските приключения, желаещи да опознаят София по нов и интригуващ начин, и е страхотен избор за всеки, който търси активно и образователно преживяване в сърцето на града.`,
		imgSrc: "images/Sofia-center.jpg",
	},
];

const gameHeadline = document.querySelector(".game-headline");
const gameImg = document.querySelector(".game-img");
const gameDescription = document.querySelector(".game-description");
const selectedGameHolder = document.querySelector(".selected-game");

const showAGame = function (gameId) {
	const game = games.find((g) => g.gameId === gameId);
	selectedGameHolder.setAttribute("data-game", gameId);
	gameHeadline.textContent = game.name;
	gameImg.src = game.imgSrc;
	gameDescription.textContent = game.description;
	selectedGameHolder.style.opacity = 1;
};

document.querySelector(".games-holder").addEventListener("click", (e) => {
	let current = e.target;
	while (current.tagName != "BODY") {
		if (current.classList.contains("game")) {
			break;
		}
		current = current.parentElement;
	}

	if (current.tagName === "BODY") return;

	showAGame(current.dataset.game);
});
