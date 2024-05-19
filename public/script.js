const reviewHolder = document.querySelector(".review-holder");
let currentTranslate = 0;
const left = function () {
	currentTranslate -= 100;
	reviewHolder.style.transform = `translateX(${currentTranslate}vw)`;
};

const right = function () {
	currentTranslate += 100;
	reviewHolder.style.transform = `translateX(${currentTranslate}vw)`;
};

document.querySelectorAll(".arr-rgt").forEach((el) => el.addEventListener("click", () => left()));
document.querySelectorAll(".arr-lft").forEach((el) => el.addEventListener("click", () => right()));
