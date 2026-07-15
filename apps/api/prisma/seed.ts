import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type WordClass = "n" | "v" | "adj" | "adv" | "n/v" | "phrase";

interface VocabSeed {
	word: string;
	wordClass: WordClass;
	meaning: string;
	example: string;
}

interface PhrasalVerbSeed {
	phrase: string;
	meaning: string;
}

interface WordFormationSeed {
	baseWord: string;
	forms: { form: string; partOfSpeech: string }[];
}

interface WordPatternSeed {
	category: "ADJECTIVE" | "VERB" | "NOUN";
	pattern: string;
	meaning: string;
}

interface PrepositionalPhraseSeed {
	phrase: string;
	meaning: string;
}

interface QuizSeed {
	category:
		| "TOPIC_VOCABULARY"
		| "PHRASAL_VERB"
		| "WORD_FORMATION"
		| "WORD_PATTERN"
		| "PREPOSITIONAL_PHRASE";
	prompt: string;
	options: string[];
	correctIndex: number;
}

interface DiscourseSeed {
	slug: string;
	title: string;
	description: string;
	order: number;
	comingSoon: boolean;
	vocabulary?: VocabSeed[];
	phrasalVerbs?: PhrasalVerbSeed[];
	wordFormation?: WordFormationSeed[];
	wordPatterns?: WordPatternSeed[];
	prepositionalPhrases?: PrepositionalPhraseSeed[];
	quiz?: QuizSeed[];
}

// Content transcribed from the "ACCESS-ES" course material photos (Discourse 1 & 2).
// Meanings/examples for phrasal verbs & word formation are written by us from the
// printed definitions; the material itself gives definitions, not example sentences,
// for those sections. Review and adjust freely -- this file is the single source of truth.
const discourses: DiscourseSeed[] = [
	{
		slug: "learning-and-doing",
		title: "Learning and Doing",
		description: "Vocabulary about studying, exams, and personal skills.",
		order: 1,
		comingSoon: false,
		vocabulary: [
			{
				word: "Achieve",
				wordClass: "v",
				meaning: "To succeed in doing something through effort or skill.",
				example: "She achieved her goal after many years of practice.",
			},
			{
				word: "Brain",
				wordClass: "n",
				meaning:
					"The organ inside your head that controls thought, memory, and feeling.",
				example: "Chess is good exercise for the brain.",
			},
			{
				word: "Clever",
				wordClass: "adj",
				meaning: "Quick to understand and learn things.",
				example: "Rebecca is really clever. She always knows the answer.",
			},
			{
				word: "Concentrate",
				wordClass: "v",
				meaning: "To give all your attention to one thing.",
				example: "It's hard to concentrate with all this noise.",
			},
			{
				word: "Consider",
				wordClass: "v",
				meaning:
					"To think carefully about something, or to think of something as true.",
				example: "Have you ever considered becoming a professional singer?",
			},
			{
				word: "Course",
				wordClass: "n",
				meaning: "A series of lessons on a particular subject.",
				example: "She's taking an English course this term.",
			},
			{
				word: "Degree",
				wordClass: "n",
				meaning:
					"A qualification given by a university after a course of study.",
				example: "He has a degree in Chemistry.",
			},
			{
				word: "Experience",
				wordClass: "n/v",
				meaning: "Knowledge or skill gained from doing something.",
				example: "She has a lot of experience in teaching.",
			},
			{
				word: "Expert",
				wordClass: "n",
				meaning: "Someone with special skill or knowledge in a subject.",
				example:
					"Carl is a computer expert. Why don't you ask him to fix your computer?",
			},
			{
				word: "Fail",
				wordClass: "v",
				meaning: "To not succeed in something, such as a test.",
				example: "I hope I don't fail the maths test tomorrow.",
			},
			{
				word: "Guess",
				wordClass: "v",
				meaning: "To give an answer without being sure if it's correct.",
				example: "I wasn't sure of the answer so I guessed.",
			},
			{
				word: "Hesitate",
				wordClass: "v",
				meaning: "To pause or be unsure before doing something.",
				example: "I always hesitate before making an important decision.",
			},
			{
				word: "Instruction",
				wordClass: "n",
				meaning: "Information that tells you how to do something.",
				example: "Read the instructions before you start the test.",
			},
			{
				word: "Make progress",
				wordClass: "phrase",
				meaning: "To improve or move forward with something.",
				example: "She's making good progress in her studies.",
			},
			{
				word: "Make sure",
				wordClass: "phrase",
				meaning: "To check that something is true or has been done.",
				example: "She told us to make sure we all understood.",
			},
			{
				word: "Mark",
				wordClass: "n",
				meaning: "A number or letter that shows how good your work is.",
				example: "It's nearly the end of term, so it will be your last mark.",
			},
			{
				word: "Mental",
				wordClass: "adj",
				meaning: "Relating to the mind.",
				example: "He needs to do a mental calculation.",
			},
			{
				word: "Pass",
				wordClass: "v",
				meaning: "To succeed in a test or exam.",
				example: "I hope you pass the exam tomorrow.",
			},
			{
				word: "Qualification",
				wordClass: "n",
				meaning:
					"A skill, type of experience, or exam result that makes you suitable for a job.",
				example: "You need a teaching qualification for this job.",
			},
			{
				word: "Remind",
				wordClass: "v",
				meaning: "To help someone remember something.",
				example: "Can you remind me to take this book back to the library?",
			},
			{
				word: "Report",
				wordClass: "n/v",
				meaning: "A written or spoken description of something that happened.",
				example: "We have to write a subject report on what happened.",
			},
			{
				word: "Revise",
				wordClass: "v",
				meaning: "To study material again in order to prepare for an exam.",
				example: "Can you revise enough before the exam?",
			},
			{
				word: "Search",
				wordClass: "v",
				meaning: "To look carefully in order to find something.",
				example: "I searched everywhere for my keys.",
			},
			{
				word: "Skill",
				wordClass: "n",
				meaning: "The ability to do something well.",
				example: "Speaking clearly is an important skill.",
			},
			{
				word: "Smart",
				wordClass: "adj",
				meaning: "Intelligent, able to think quickly.",
				example: "Rosalind is a really smart, talented musician.",
			},
			{
				word: "Subject",
				wordClass: "n",
				meaning: "An area of knowledge studied at school.",
				example: "Chemistry is my favourite subject.",
			},
			{
				word: "Take an exam",
				wordClass: "phrase",
				meaning: "To do a formal test of knowledge.",
				example: "We had our English exam today.",
			},
			{
				word: "Talented",
				wordClass: "adj",
				meaning: "Having a natural ability to do something well.",
				example: "Rosalind is a really talented musician.",
			},
			{
				word: "Term",
				wordClass: "n",
				meaning: "One of the periods a school year is divided into.",
				example:
					"It's nearly the end of term, so it will be the holidays soon.",
			},
			{
				word: "Wonder",
				wordClass: "v",
				meaning:
					"To want to know something, to think about something with curiosity.",
				example: "I wonder how difficult the maths test tomorrow will be.",
			},
		],
		phrasalVerbs: [
			{
				phrase: "Cross out",
				meaning: "Draw a line through something written.",
			},
			{
				phrase: "Look up",
				meaning: "Try to find information in a book, dictionary, etc.",
			},
			{
				phrase: "Point out",
				meaning: "Tell somebody an important piece of information.",
			},
			{
				phrase: "Read out",
				meaning: "Say something out loud while you are reading it.",
			},
			{ phrase: "Rip up", meaning: "Tear something into pieces." },
			{
				phrase: "Rub out",
				meaning: "Remove something written in pencil with a rubber.",
			},
			{
				phrase: "Turn over",
				meaning: "Turn something so the other side is facing you.",
			},
			{
				phrase: "Write down",
				meaning: "Write information on a piece of paper.",
			},
		],
		wordFormation: [
			{
				baseWord: "Begin",
				forms: [
					{ form: "began", partOfSpeech: "verb (past)" },
					{ form: "begun", partOfSpeech: "verb (past participle)" },
					{ form: "beginner", partOfSpeech: "noun" },
					{ form: "beginning", partOfSpeech: "noun" },
				],
			},
			{ baseWord: "Brave", forms: [{ form: "bravery", partOfSpeech: "noun" }] },
			{
				baseWord: "Correct",
				forms: [
					{ form: "correction", partOfSpeech: "noun" },
					{ form: "incorrect", partOfSpeech: "adjective" },
				],
			},
			{
				baseWord: "Divide",
				forms: [{ form: "division", partOfSpeech: "noun" }],
			},
			{
				baseWord: "Educate",
				forms: [{ form: "education", partOfSpeech: "noun" }],
			},
			{
				baseWord: "Instruct",
				forms: [
					{ form: "instruction", partOfSpeech: "noun" },
					{ form: "instructor", partOfSpeech: "noun" },
				],
			},
			{
				baseWord: "Memory",
				forms: [
					{ form: "memorise", partOfSpeech: "verb" },
					{ form: "memorial", partOfSpeech: "adjective" },
				],
			},
			{
				baseWord: "Refer",
				forms: [{ form: "reference", partOfSpeech: "noun" }],
			},
			{
				baseWord: "Silent",
				forms: [
					{ form: "silence", partOfSpeech: "noun" },
					{ form: "silently", partOfSpeech: "adverb" },
				],
			},
			{
				baseWord: "Simple",
				forms: [
					{ form: "simplify", partOfSpeech: "verb" },
					{ form: "simplicity", partOfSpeech: "noun" },
				],
			},
		],
		wordPatterns: [
			{
				category: "ADJECTIVE",
				pattern: "capable of",
				meaning: "She's capable of passing the exam easily.",
			},
			{
				category: "ADJECTIVE",
				pattern: "talented at",
				meaning: "He's talented at music.",
			},
			{
				category: "VERB",
				pattern: "chat about/in",
				meaning: "We chatted about the exam in English.",
			},
			{
				category: "VERB",
				pattern: "confuse sth with",
				meaning: "Don't confuse this word with that one.",
			},
			{
				category: "VERB",
				pattern: "continue with",
				meaning: "Let's continue with the next question.",
			},
			{
				category: "VERB",
				pattern: "cope with",
				meaning: "It's hard to cope with so much homework.",
			},
			{
				category: "VERB",
				pattern: "help sb with",
				meaning: "Can you help me with my English?",
			},
			{
				category: "VERB",
				pattern: "know about",
				meaning: "Do you know about dinosaurs?",
			},
			{
				category: "VERB",
				pattern: "learn about",
				meaning: "We're learning about dinosaurs at school.",
			},
			{
				category: "VERB",
				pattern: "succeed in",
				meaning: "It's a good idea to succeed in your exams.",
			},
			{
				category: "NOUN",
				pattern: "an opinion about/of",
				meaning: "What's your opinion of the new teacher?",
			},
			{
				category: "NOUN",
				pattern: "a question about",
				meaning: "I have a question about the homework.",
			},
		],
		prepositionalPhrases: [
			{ phrase: "by heart", meaning: "Memorised completely." },
			{ phrase: "for instance", meaning: "Used to give an example." },
			{
				phrase: "in conclusion",
				meaning: "Used to introduce a final summary.",
			},
			{
				phrase: "in fact",
				meaning: "Used to emphasise that something is true.",
			},
			{
				phrase: "in favour (of)",
				meaning: "Supporting or agreeing with something.",
			},
			{
				phrase: "in general",
				meaning: "Considering something as a whole, not specific details.",
			},
		],
		quiz: [
			{
				category: "TOPIC_VOCABULARY",
				prompt: "I ___ how difficult the maths test tomorrow will be.",
				options: ["wonder", "guess", "hesitate", "consider"],
				correctIndex: 0,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt: "It's nearly the end of ___, so it will be the holidays soon!",
				options: ["mark", "course", "term", "degree"],
				correctIndex: 2,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt: "Can you ___ me to take this book back to the library?",
				options: ["revise", "remind", "report", "search"],
				correctIndex: 1,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt:
					"Carl is a computer ___. Why don't you ask him to fix your computer?",
				options: ["brain", "expert", "smart", "talented"],
				correctIndex: 1,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt: "Rebecca is really ___. She always knows the answer.",
				options: ["mental", "clever", "hesitant", "mark"],
				correctIndex: 1,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt: "I wasn't sure of the answer so I ___.",
				options: ["guessed", "hesitated", "considered", "revised"],
				correctIndex: 0,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt: "Have you ever ___ becoming a professional singer?",
				options: ["guessed", "hesitated", "considered", "achieved"],
				correctIndex: 2,
			},
			{
				category: "PHRASAL_VERB",
				prompt: "She ___ the instructions to make sure we all understood.",
				options: ["read out", "rubbed out", "ripped up", "pointed out"],
				correctIndex: 0,
			},
			{
				category: "PHRASAL_VERB",
				prompt: "We weren't allowed to ___ anything written in pen.",
				options: ["cross out", "rub out", "write down", "turn over"],
				correctIndex: 1,
			},
			{
				category: "PREPOSITIONAL_PHRASE",
				prompt: "I learnt that poem ___ but I've forgotten it now.",
				options: ["in fact", "by heart", "in general", "for instance"],
				correctIndex: 1,
			},
			{
				category: "WORD_PATTERN",
				prompt:
					"It's a good idea to do something active rather than ___ homework.",
				options: ["cope with", "chat about", "help with", "learn about"],
				correctIndex: 0,
			},
		],
	},
	{
		slug: "buying-and-selling",
		title: "Buying and Selling",
		description: "Vocabulary about shopping, money, and business.",
		order: 2,
		comingSoon: false,
		vocabulary: [
			{
				word: "Advertisement",
				wordClass: "n",
				meaning: "A notice, picture, or film telling people about a product.",
				example: "You've seen an advertisement offering a bargain.",
			},
			{
				word: "Afford",
				wordClass: "v",
				meaning: "To have enough money to pay for something.",
				example: "Even good quality clothes are quite affordable in this shop.",
			},
			{
				word: "Bargain",
				wordClass: "n/v",
				meaning: "A thing bought cheaply, or an agreement about a price.",
				example: "It was a real bargain at that price.",
			},
			{
				word: "Brand",
				wordClass: "n",
				meaning: "A type of product made by a particular company.",
				example: "Which brand of trainers do you prefer?",
			},
			{
				word: "Catalogue",
				wordClass: "n",
				meaning: "A book or list of goods you can buy.",
				example: "Look at the catalogue before you order.",
			},
			{
				word: "Change",
				wordClass: "n/v",
				meaning:
					"Money returned when you pay more than the price, or to exchange something.",
				example: "Did you get your change from the shop?",
			},
			{
				word: "Coin",
				wordClass: "n",
				meaning: "A round piece of metal used as money.",
				example: "Can I pay for this with coins?",
			},
			{
				word: "Cost",
				wordClass: "n/v",
				meaning: "The amount of money needed to buy something.",
				example: "How much did the car cost?",
			},
			{
				word: "Customer",
				wordClass: "n",
				meaning: "A person who buys goods or services.",
				example: "You need to know what your customers will demand.",
			},
			{
				word: "Debt",
				wordClass: "n",
				meaning: "Money that you owe to somebody.",
				example: "Before borrowing from the bank, think about being in debt.",
			},
			{
				word: "Demand",
				wordClass: "n/v",
				meaning: "To ask for something firmly, or a strong need for a product.",
				example: "You need to know what your customers will demand.",
			},
			{
				word: "Export",
				wordClass: "n/v",
				meaning: "To sell and send goods to another country.",
				example: "Being big in business requires exports.",
			},
			{
				word: "Fee",
				wordClass: "n",
				meaning: "An amount of money paid for a service.",
				example: "You have to pay a fee to join the club.",
			},
			{
				word: "Fortune",
				wordClass: "n",
				meaning: "A large amount of money.",
				example: "Our course will help you make a fortune in business.",
			},
			{
				word: "Import",
				wordClass: "n/v",
				meaning: "To bring goods into a country in order to sell them.",
				example: "The shop imports clothes from Italy.",
			},
			{
				word: "Invest",
				wordClass: "v",
				meaning: "To put money into something in order to make a profit.",
				example:
					"Before borrowing money you have to decide whether to invest it.",
			},
			{
				word: "Obtain",
				wordClass: "v",
				meaning: "To get something.",
				example: "You can obtain a discount if you pay in cash.",
			},
			{
				word: "Owe",
				wordClass: "v",
				meaning: "To need to pay money back to somebody.",
				example: "He owes the bank a lot of money.",
			},
			{
				word: "Property",
				wordClass: "n",
				meaning:
					"A thing, or things, belonging to somebody; a building or land.",
				example: "This shop's property is worth a fortune.",
			},
			{
				word: "Purchase",
				wordClass: "n/v",
				meaning: "To buy something.",
				example: "Could you help me make a decision about this purchase?",
			},
			{
				word: "Receipt",
				wordClass: "n",
				meaning: "A piece of paper showing you've paid for something.",
				example: "Could you check your receipt before you leave?",
			},
			{
				word: "Require",
				wordClass: "v",
				meaning: "To need something.",
				example: "Being big in business requires a certain way of thinking.",
			},
			{
				word: "Sale",
				wordClass: "n",
				meaning:
					"The act of selling, or a time when shops sell things cheaply.",
				example: "Is the house next door up for sale?",
			},
			{
				word: "Select",
				wordClass: "v",
				meaning: "To choose something carefully.",
				example: "You have to select the best option.",
			},
			{
				word: "Supply",
				wordClass: "n/v",
				meaning: "To provide something that is needed.",
				example: "We'll supply our customers with what they demand.",
			},
			{
				word: "Variety",
				wordClass: "n",
				meaning: "A number of different types of something.",
				example: "Every supermarket sells a variety of good quality clothes.",
			},
			{
				word: "Waste",
				wordClass: "n/v",
				meaning: "To use something carelessly, without a good result.",
				example: "Don't waste your money on cheap products.",
			},
			{
				word: "Profit",
				wordClass: "n/v",
				meaning: "Money gained in business after costs are paid.",
				example: "Do you really make a profit again and again?",
			},
		],
		phrasalVerbs: [
			{ phrase: "Add up", meaning: "Find the total of something." },
			{ phrase: "Come back (from)", meaning: "Return (from somewhere)." },
			{ phrase: "Give away", meaning: "Give something free of charge." },
			{ phrase: "Hurry up", meaning: "Do something more quickly." },
			{ phrase: "Pay back", meaning: "Return money (to somebody)." },
			{
				phrase: "Save up (for)",
				meaning: "Save money for a specific purpose.",
			},
			{
				phrase: "Take back",
				meaning: "Return something to the place it came from.",
			},
			{ phrase: "Take down", meaning: "Remove something from a high place." },
		],
		wordFormation: [
			{
				baseWord: "Add",
				forms: [
					{ form: "addition", partOfSpeech: "noun" },
					{ form: "additional", partOfSpeech: "adjective" },
				],
			},
			{
				baseWord: "Afford",
				forms: [{ form: "affordable", partOfSpeech: "adjective" }],
			},
			{
				baseWord: "Compare",
				forms: [{ form: "comparison", partOfSpeech: "noun" }],
			},
			{
				baseWord: "Decide",
				forms: [{ form: "decision", partOfSpeech: "noun" }],
			},
			{
				baseWord: "Expense",
				forms: [{ form: "expensive", partOfSpeech: "adjective" }],
			},
			{
				baseWord: "Judge",
				forms: [{ form: "judgment", partOfSpeech: "noun" }],
			},
			{
				baseWord: "Serve",
				forms: [
					{ form: "service", partOfSpeech: "noun" },
					{ form: "servant", partOfSpeech: "noun" },
				],
			},
			{ baseWord: "True", forms: [{ form: "truth", partOfSpeech: "noun" }] },
			{
				baseWord: "Use",
				forms: [
					{ form: "useful", partOfSpeech: "adjective" },
					{ form: "useless", partOfSpeech: "adjective" },
				],
			},
			{
				baseWord: "Value",
				forms: [{ form: "valuable", partOfSpeech: "adjective" }],
			},
		],
		wordPatterns: [
			{
				category: "ADJECTIVE",
				pattern: "wrong about",
				meaning: "I was wrong about the price.",
			},
			{
				category: "VERB",
				pattern: "belong to",
				meaning: "This shop belongs to my uncle.",
			},
			{
				category: "VERB",
				pattern: "borrow sth from sb",
				meaning: "Can I borrow some money from you?",
			},
			{
				category: "VERB",
				pattern: "buy sth from",
				meaning: "I bought this jacket from that new shop.",
			},
			{
				category: "VERB",
				pattern: "choose between sth/sth",
				meaning: "It's hard to choose between these two brands.",
			},
			{
				category: "VERB",
				pattern: "compare sth to/with",
				meaning: "Compare this price with the one online.",
			},
			{
				category: "VERB",
				pattern: "decide on/whether/to",
				meaning: "Have you decided on the vase yet?",
			},
			{
				category: "VERB",
				pattern: "lend sth to sb",
				meaning: "Could you lend some money to me?",
			},
			{
				category: "VERB",
				pattern: "pay for sth",
				meaning: "Can I pay for this with a credit card?",
			},
			{
				category: "VERB",
				pattern: "spend sth on",
				meaning: "Don't spend too much money on clothes.",
			},
			{
				category: "NOUN",
				pattern: "an advert(isement) for",
				meaning: "I saw an advert for a big sale.",
			},
		],
		prepositionalPhrases: [
			{
				phrase: "by credit card/cheque",
				meaning: "Paying using a credit card or cheque.",
			},
			{
				phrase: "for rent/discount",
				meaning: "Available to rent, or with money off the price.",
			},
			{ phrase: "for sale", meaning: "Available to buy." },
			{ phrase: "in cash", meaning: "Paying with notes and coins." },
			{
				phrase: "in (good/bad) condition",
				meaning: "Describing the physical state of something.",
			},
			{ phrase: "in debt", meaning: "Owing money to somebody." },
		],
		quiz: [
			{
				category: "TOPIC_VOCABULARY",
				prompt: "So, you've seen an ___ for a bargain?",
				options: ["advertisement", "catalogue", "receipt", "property"],
				correctIndex: 0,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt:
					"But do you really know what you're doing? Do you make a ___ again and again?",
				options: ["cost", "profit", "debt", "fee"],
				correctIndex: 1,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt:
					"Why don't you attend our specialist business seminar and learn how to make a ___ in business!",
				options: ["catalogue", "fortune", "receipt", "sale"],
				correctIndex: 1,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt: "Being big in business ___ a certain way of thinking.",
				options: ["requires", "imports", "wastes", "owes"],
				correctIndex: 0,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt: "You need to know what your customers will ___.",
				options: ["waste", "demand", "select", "export"],
				correctIndex: 1,
			},
			{
				category: "TOPIC_VOCABULARY",
				prompt:
					"...and then find a way to ___ them with it at the right price.",
				options: ["owe", "supply", "obtain", "afford"],
				correctIndex: 1,
			},
			{
				category: "WORD_FORMATION",
				prompt: "Companies should always tell the ___ in advertisements.",
				options: ["truth", "true", "truthful", "truthfully"],
				correctIndex: 0,
			},
			{
				category: "WORD_FORMATION",
				prompt: "Could you help me make a ___ about this vase?",
				options: ["decide", "decision", "decisive", "decidable"],
				correctIndex: 1,
			},
			{
				category: "WORD_FORMATION",
				prompt: "Even good quality clothes are quite ___ in this shop.",
				options: ["afford", "affordable", "affordability", "affording"],
				correctIndex: 1,
			},
			{
				category: "PHRASAL_VERB",
				prompt: "She's ___ for a new phone.",
				options: ["saving up", "paying back", "giving away", "taking down"],
				correctIndex: 0,
			},
			{
				category: "PREPOSITIONAL_PHRASE",
				prompt: "We need to pay ___ to get a discount.",
				options: ["in debt", "in cash", "for rent", "for sale"],
				correctIndex: 1,
			},
		],
	},
	{
		slug: "working-and-business",
		title: "Working and Business",
		description: "Coming soon.",
		order: 3,
		comingSoon: true,
	},
	{
		slug: "community-and-services",
		title: "Community and Services",
		description: "Coming soon.",
		order: 4,
		comingSoon: true,
	},
	{
		slug: "travel-and-leisure",
		title: "Travel and Leisure",
		description: "Coming soon.",
		order: 5,
		comingSoon: true,
	},
];

async function main() {
	for (const d of discourses) {
		const discourse = await prisma.discourse.upsert({
			where: { slug: d.slug },
			create: {
				slug: d.slug,
				title: d.title,
				description: d.description,
				order: d.order,
				comingSoon: d.comingSoon,
			},
			update: {
				title: d.title,
				description: d.description,
				order: d.order,
				comingSoon: d.comingSoon,
			},
		});

		// Clear existing content for this discourse so the seed is re-runnable.
		await prisma.quizOption.deleteMany({
			where: { question: { discourseId: discourse.id } },
		});
		await prisma.quizQuestion.deleteMany({
			where: { discourseId: discourse.id },
		});
		await prisma.wordFormationForm.deleteMany({
			where: { entry: { discourseId: discourse.id } },
		});
		await prisma.wordFormationEntry.deleteMany({
			where: { discourseId: discourse.id },
		});
		await prisma.vocabularyWord.deleteMany({
			where: { discourseId: discourse.id },
		});
		await prisma.phrasalVerb.deleteMany({
			where: { discourseId: discourse.id },
		});
		await prisma.wordPattern.deleteMany({
			where: { discourseId: discourse.id },
		});
		await prisma.prepositionalPhrase.deleteMany({
			where: { discourseId: discourse.id },
		});

		for (const [i, v] of (d.vocabulary ?? []).entries()) {
			await prisma.vocabularyWord.create({
				data: { discourseId: discourse.id, order: i, ...v },
			});
		}

		for (const [i, p] of (d.phrasalVerbs ?? []).entries()) {
			await prisma.phrasalVerb.create({
				data: { discourseId: discourse.id, order: i, ...p },
			});
		}

		for (const [i, wf] of (d.wordFormation ?? []).entries()) {
			await prisma.wordFormationEntry.create({
				data: {
					discourseId: discourse.id,
					order: i,
					baseWord: wf.baseWord,
					forms: { create: wf.forms },
				},
			});
		}

		for (const [i, wp] of (d.wordPatterns ?? []).entries()) {
			await prisma.wordPattern.create({
				data: { discourseId: discourse.id, order: i, ...wp },
			});
		}

		for (const [i, pp] of (d.prepositionalPhrases ?? []).entries()) {
			await prisma.prepositionalPhrase.create({
				data: { discourseId: discourse.id, order: i, ...pp },
			});
		}

		for (const [i, q] of (d.quiz ?? []).entries()) {
			await prisma.quizQuestion.create({
				data: {
					discourseId: discourse.id,
					order: i,
					category: q.category,
					prompt: q.prompt,
					options: {
						create: q.options.map((text, optionIndex) => ({
							text,
							isCorrect: optionIndex === q.correctIndex,
						})),
					},
				},
			});
		}

		console.log(
			`Seeded ${d.title}: ${d.vocabulary?.length ?? 0} words, ${d.phrasalVerbs?.length ?? 0} phrasal verbs, ${d.quiz?.length ?? 0} quiz questions`,
		);
	}
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
