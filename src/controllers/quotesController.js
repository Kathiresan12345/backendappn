// Motivational quotes for safety and well-being
const quotes = [
    { quote: "Small habits prevent big worries.", author: "Anonymous" },
    { quote: "Safety is not a gadget but a state of mind.", author: "Eleanor Everet" },
    { quote: "Your safety is worth more than a thousand rushed moments.", author: "Unknown" },
    { quote: "Better safe than sorry.", author: "Proverb" },
    { quote: "The best preparation for tomorrow is doing your best today.", author: "H. Jackson Brown Jr." },
    { quote: "Take care of yourself. You never know when the world will need you.", author: "Rabbi Hillel" },
    { quote: "Safety doesn't happen by accident.", author: "Unknown" },
    { quote: "An ounce of prevention is worth a pound of cure.", author: "Benjamin Franklin" },
    { quote: "Your life is worth the extra minute it takes to be safe.", author: "Unknown" },
    { quote: "Safety is a cheap and effective insurance policy.", author: "Unknown" },
    { quote: "Think safety, work safely.", author: "Unknown" },
    { quote: "Safety is something that happens between your ears, not something you hold in your hands.", author: "Jeff Cooper" },
    { quote: "The door of safety swings on the hinges of common sense.", author: "Unknown" },
    { quote: "Precaution is better than cure.", author: "Edward Coke" },
    { quote: "Safety is not expensive, it's priceless.", author: "Jerry Smith" },
    { quote: "Your family needs you. Work safely.", author: "Unknown" },
    { quote: "Safety is a continuing journey, not a final destination.", author: "Unknown" },
    { quote: "Be aware, take care.", author: "Unknown" },
    { quote: "Safety is everyone's responsibility.", author: "Unknown" },
    { quote: "A moment of distraction can lead to a lifetime of regret.", author: "Unknown" },
    { quote: "Stay alert, don't get hurt.", author: "Unknown" },
    { quote: "Safety first, because accidents last.", author: "Unknown" },
    { quote: "Working safely may get old, but so do those who practice it.", author: "Unknown" },
    { quote: "The best safety device is a careful operator.", author: "Unknown" },
    { quote: "Safety is no accident.", author: "Unknown" },
    { quote: "Think before you act. Safety is a fact.", author: "Unknown" },
    { quote: "Your well-being is your wealth.", author: "Unknown" },
    { quote: "Peace of mind comes from knowing you're prepared.", author: "Unknown" },
    { quote: "Being safe is being smart.", author: "Unknown" },
    { quote: "Every day is a fresh start to prioritize your safety.", author: "Unknown" }
];

exports.getDailyQuote = async (req, res) => {
    try {
        // Use current date to get a consistent quote for the day
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

        // Select quote based on day of year (rotates through all quotes)
        const quoteIndex = dayOfYear % quotes.length;
        const selectedQuote = quotes[quoteIndex];

        console.log(`✅ [SUCCESS] getDailyQuote - Sent quote: "${selectedQuote.quote.substring(0, 20)}..."`);
        res.json({
            success: true,
            quote: selectedQuote.quote,
            author: selectedQuote.author
        });
    } catch (error) {
        console.error(`❌ [ERROR] getDailyQuote:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch quote',
            // Fallback quote
            quote: "Small habits prevent big worries.",
            author: "Anonymous"
        });
    }
};

exports.getRandomQuote = async (req, res) => {
    try {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const selectedQuote = quotes[randomIndex];

        console.log(`✅ [SUCCESS] getRandomQuote - Sent quote: "${selectedQuote.quote.substring(0, 20)}..."`);
        res.json({
            success: true,
            quote: selectedQuote.quote,
            author: selectedQuote.author
        });
    } catch (error) {
        console.error(`❌ [ERROR] getRandomQuote:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch quote'
        });
    }
};
