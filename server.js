import Stripe from "stripe";
import express from "express";
import Mailjet from "node-mailjet";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, child, update, push } from "firebase/database";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
const stripe = new Stripe(STRIPE_API_KEY);

const app = express();

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const DOMAIN = process.env.DOMAIN;

const MAILJET_PUBLIC = process.env.MAILJET_PUBLIC;
const MAILJET_PRIVATE = process.env.MAILJET_PRIVATE;

const mailjet = new Mailjet({
	apiKey: MAILJET_PUBLIC,
	apiSecret: MAILJET_PRIVATE,
});

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const firebaseConfig = {
	apiKey: FIREBASE_API_KEY,
	authDomain: "project-games-12bf5.firebaseapp.com",
	projectId: "project-games-12bf5",
	storageBucket: "project-games-12bf5.appspot.com",
	messagingSenderId: "1084022988521",
	appId: "1:1084022988521:web:d4aaf94b935be2d6c69a78",
	databaseURL: "https://project-games-12bf5-default-rtdb.europe-west1.firebasedatabase.app",
};

const firebase_app = initializeApp(firebaseConfig);
const database = getDatabase(firebase_app);

app.post("/create-checkout-session", async (req, res) => {
	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				price: "price_1PBj2hFhqW5VVkMXdBpgV3wl",
				quantity: 1,
			},
		],
		mode: "payment",
		success_url: `${DOMAIN}/success.html`,
		cancel_url: `${DOMAIN}/cancel.html`,
	});

	res.json({ url: session.url });
});

const endpointSecret = "whsec_0f98da4a0ea63d10fc6f84a66a8d8b47e21117e6ecae25a14e3b2ee9226e6246";

// Use body-parser to retrieve the raw body as a buffer
const sendEmail = async function (type, receiver, code = "") {
	if (type == "code") {
		try {
			const request = await mailjet.post("send", { version: "v3.1" }).request({
				Messages: [
					{
						From: {
							Email: "viki.slavchev05@gmail.com",
							Name: "Разгадай София",
						},
						To: [
							{
								Email: receiver.email,
								Name: receiver.name,
							},
						],
						TemplateID: 5942224,
						TemplateLanguage: true,
						Subject: "Код за игра",
						Variables: {
							code: code,
						},
					},
				],
			});

			console.log(request.body);
		} catch (err) {
			console.error(err);
		}
	}
};

const generateCode = function (length) {
	const result = [];
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
	}
	return result.join("");
};
const fulfillOrder = async (session) => {
	const email = session.customer_details.email;
	const name = session.customer_details.name;
	console.log(email, name);
	const code = generateCode(10);

	try {
		push(ref(database, "passwords"), {
			game: "borisova",
			password: code,
			points: 0,
			qInd: 0,
			qSeq: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			timeEnded: -1,
			timeStarted: -1,
			usedHelp: false,
		});
	} catch (err) {
		console.error(err);
	}

	console.log("The new code is", code);
	sendEmail("code", { name, email }, code);
};

const emailCustomerAboutFailedPayment = (session) => {
	// TODO: fill me in
	console.log("Emailing customer", session);
};

app.post("/webhook", bodyParser.raw({ type: "application/json" }), (request, response) => {
	const payload = request.body;
	const sig = request.headers["stripe-signature"];

	let event;

	try {
		event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
	} catch (err) {
		return response.status(400).send(`Webhook Error: ${err.message}`);
	}

	console.log("In a webhook ", event?.type);
	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object;

			if (session.payment_status === "paid") {
				fulfillOrder(session);
			}

			break;
		}

		case "checkout.session.async_payment_succeeded": {
			const session = event.data.object;
			fulfillOrder(session);

			break;
		}

		case "checkout.session.async_payment_failed": {
			const session = event.data.object;
			emailCustomerAboutFailedPayment(session);

			break;
		}
	}

	response.status(200).end();
});

app.post("/next-question", express.json(), async (req, res) => {
	console.log(req.body);
	// .points
	// .questInd
	await update(ref(database, `passwords/${req.body.key}`), {
		qInd: req.body.questInd,
		points: req.body.points,
		usedHelp: false,
	});

	res.sendStatus(200);
	res.end();
});

app.post("/use-help", express.json(), async (req, res) => {
	await update(ref(database, `passwords/${req.body.key}`), {
		usedHelp: true,
	});
	res.sendStatus(200);
	res.end();
});

app.post("/finish-game", express.json(), async (req, res) => {
	await update(ref(database, `passwords/${req.body.key}`), {
		usedHelp: true,
	});
	res.sendStatus(200);
	res.end();
});
app.post("/check-pass", express.json(), async (req, res) => {
	const { password: givenPass } = req.body;
	console.log(givenPass);

	const val = await get(ref(database, "passwords"));
	if (!val.exists()) {
		res.json({ isCorrect: false });
	}

	const arrPass = val.val();

	for (const key in arrPass) {
		if (arrPass.hasOwnProperty(key)) {
			const entry = arrPass[key];
			// console.log(`Game: ${entry.game}, Password: ${entry.password}, Key: ${key}`);
			if (givenPass !== entry.password) continue;
			// console.log("Got a match");
			let { timeStarted } = entry;
			if (timeStarted === -1) {
				timeStarted = new Date().toISOString();
				await update(ref(database, `passwords/${key}`), {
					...entry,
					timeStarted: timeStarted,
				});
			}
			const obj = {
				key,
				game: entry.game,
				points: entry.points,
				qInd: entry.qInd,
				qSeq: entry.qSeq,
				timeEnded: entry.timeEnded,
				timeStarted,
				usedHelp: entry.usedHelp,
			};
			console.log(obj);
			res.json(obj);

			return;
		}
	}

	res.json({
		key: "wp",
	});
});

app.listen(PORT, () => console.log("Running on port" + PORT));

/*
try {
	const msg = await update(ref(database, currTeam), {
		usedHelp: false,
		points: currPoints,
		qInd: questInd,
		timeEnded: timeEnded.toISOString(),
	});
} catch (err) {	
	alert(err);
}

*/
