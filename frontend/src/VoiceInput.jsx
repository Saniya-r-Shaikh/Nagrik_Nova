import { useState } from "react";

function VoiceInput({ data, setData }) {
  // -----------------------------------------
  // QUESTIONS IN BOTH LANGUAGES
  // -----------------------------------------

  const questions = {
    en: [
      {
        field: "title",
        question: "What is the title of the problem?"
      },
      {
        field: "description",
        question: "What is happening? Please describe the problem."
      },
      {
        field: "state",
        question: "Which state is this problem in?"
      },
      {
        field: "city",
        question: "Which city is this problem in?"
      },
      {
        field: "street",
        question: "What is the exact street, landmark, or location?"
      }
    ],

    hi: [
      {
        field: "title",
        question: "समस्या का शीर्षक क्या है?"
      },
      {
        field: "description",
        question: "क्या समस्या हो रही है? कृपया उसके बारे में बताइए।"
      },
      {
        field: "state",
        question: "यह समस्या किस राज्य में है?"
      },
      {
        field: "city",
        question: "यह समस्या किस शहर में है?"
      },
      {
        field: "street",
        question: "सटीक सड़क, लैंडमार्क या स्थान क्या है?"
      }
    ]
  };

  // -----------------------------------------
  // SELECTED LANGUAGE
  // -----------------------------------------

  const [language, setLanguage] = useState("en");

  // -----------------------------------------
  // CURRENT QUESTION
  // -----------------------------------------

  const [currentQuestion, setCurrentQuestion] = useState(0);

  // -----------------------------------------
  // VOICE CONVERSATION STARTED?
  // -----------------------------------------

  const [started, setStarted] = useState(false);

  // -----------------------------------------
  // MICROPHONE LISTENING?
  // -----------------------------------------

  const [listening, setListening] = useState(false);

  // -----------------------------------------
  // ALL QUESTIONS COMPLETED?
  // -----------------------------------------

  const [completed, setCompleted] = useState(false);

  // -----------------------------------------
  // WHAT THE BROWSER HEARD
  // -----------------------------------------

  const [heardText, setHeardText] = useState("");

  // -----------------------------------------
  // GET QUESTIONS FOR CURRENT LANGUAGE
  // -----------------------------------------

  const currentQuestions = questions[language];

  // -----------------------------------------
  // MAKE COMPUTER SPEAK
  // -----------------------------------------

  const speak = (text) => {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    // English or Hindi voice
    speech.lang =
      language === "hi" ? "hi-IN" : "en-IN";

    window.speechSynthesis.speak(speech);
  };

  // -----------------------------------------
  // LISTEN TO USER
  // -----------------------------------------

  const listen = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    // Browser support check
    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    // Create recognition object
    const recognition = new SpeechRecognition();

    // -----------------------------------------
    // SPEECH RECOGNITION LANGUAGE
    // -----------------------------------------

    recognition.lang =
      language === "hi" ? "hi-IN" : "en-IN";

    // One answer at a time
    recognition.continuous = false;

    // Only final result
    recognition.interimResults = false;

    // Ask for up to 3 possible interpretations
    recognition.maxAlternatives = 3;

    // -----------------------------------------
    // WHEN USER'S SPEECH IS RECEIVED
    // -----------------------------------------

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      console.log("Browser heard:", transcript);

      // Show what browser heard
      setHeardText(transcript);

      // Find current form field
      const field =
        currentQuestions[currentQuestion].field;

      console.log("Saving into field:", field);

      // Save into EXISTING NagrikNova form
      setData((previous) => ({
        ...previous,
        [field]: transcript,
      }));

      setListening(false);

      // -----------------------------------------
      // MOVE TO NEXT QUESTION
      // -----------------------------------------

      if (
        currentQuestion <
        currentQuestions.length - 1
      ) {
        const nextQuestion =
          currentQuestion + 1;

        setCurrentQuestion(nextQuestion);

        // Clear previous "I heard"
        setHeardText("");

        // Ask next question
        speak(
          currentQuestions[nextQuestion].question
        );
      } else {
        // -----------------------------------------
        // ALL QUESTIONS COMPLETED
        // -----------------------------------------

        setCompleted(true);

        if (language === "hi") {
          speak(
            "धन्यवाद। आपकी शिकायत की जानकारी पूरी हो गई है।"
          );
        } else {
          speak(
            "Thank you. Your complaint information is complete."
          );
        }
      }
    };

    // -----------------------------------------
    // IF AN ERROR OCCURS
    // -----------------------------------------

    recognition.onerror = (event) => {
      console.log(
        "Speech recognition error:",
        event.error
      );

      setListening(false);

      if (event.error === "no-speech") {
        alert(
          language === "hi"
            ? "मैं आपकी आवाज़ नहीं सुन पाया। कृपया फिर से कोशिश करें।"
            : "I couldn't hear you. Please try again."
        );
      } else if (event.error === "not-allowed") {
        alert(
          language === "hi"
            ? "माइक्रोफ़ोन की अनुमति नहीं दी गई।"
            : "Microphone permission was denied."
        );
      } else if (
        event.error === "audio-capture"
      ) {
        alert(
          language === "hi"
            ? "माइक्रोफ़ोन का उपयोग नहीं किया जा सका।"
            : "The microphone could not be accessed."
        );
      } else {
        alert(
          language === "hi"
            ? "वॉइस पहचान में समस्या हुई। कृपया फिर से कोशिश करें।"
            : "Something went wrong with voice recognition. Please try again."
        );
      }
    };

    // -----------------------------------------
    // WHEN MICROPHONE STOPS
    // -----------------------------------------

    recognition.onend = () => {
      console.log("Microphone stopped");

      setListening(false);
    };

    // -----------------------------------------
    // START MICROPHONE
    // -----------------------------------------

    setListening(true);

    recognition.start();
  };

  // -----------------------------------------
  // START VOICE REPORT
  // -----------------------------------------

  const startConversation = () => {
    setStarted(true);

    setCurrentQuestion(0);

    setHeardText("");

    speak(currentQuestions[0].question);
  };

  // -----------------------------------------
  // CHANGE LANGUAGE
  // -----------------------------------------

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        marginBottom: "20px",
      }}
    >
      <h2>🎙️ Voice Complaint Assistant</h2>

      {/* -----------------------------------------
          LANGUAGE SELECTION
      ----------------------------------------- */}

      {!started && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Select Language / भाषा चुनें</h3>

          <button
            type="button"
            onClick={() => changeLanguage("en")}
            style={{
              marginRight: "10px",
              padding: "10px 15px",
              border:
                language === "en"
                  ? "2px solid #000"
                  : "1px solid #ccc",
              borderRadius: "8px",
              background:
                language === "en"
                  ? "#eee"
                  : "#fff",
              cursor: "pointer",
            }}
          >
            English
          </button>

          <button
            type="button"
            onClick={() => changeLanguage("hi")}
            style={{
              padding: "10px 15px",
              border:
                language === "hi"
                  ? "2px solid #000"
                  : "1px solid #ccc",
              borderRadius: "8px",
              background:
                language === "hi"
                  ? "#eee"
                  : "#fff",
              cursor: "pointer",
            }}
          >
            हिंदी
          </button>
        </div>
      )}

      {/* -----------------------------------------
          START BUTTON
      ----------------------------------------- */}

      {!started && (
        <button
          type="button"
          onClick={startConversation}
        >
          🎙️{" "}
          {language === "hi"
            ? "वॉइस रिपोर्ट शुरू करें"
            : "Start Voice Report"}
        </button>
      )}

      {/* -----------------------------------------
          QUESTION + MICROPHONE
      ----------------------------------------- */}

      {started && !completed && (
        <div>
          <h3>
            {language === "hi"
              ? `प्रश्न ${currentQuestion + 1} / ${currentQuestions.length}`
              : `Question ${currentQuestion + 1} of ${currentQuestions.length}`}
          </h3>

          <p>
            {currentQuestions[currentQuestion].question}
          </p>

          {/* SHOW WHAT BROWSER HEARD */}

          {heardText && (
            <p>
              <strong>
                {language === "hi"
                  ? "मैंने सुना:"
                  : "I heard:"}
              </strong>{" "}
              {heardText}
            </p>
          )}

          <button
            type="button"
            onClick={listen}
            disabled={listening}
          >
            {listening
              ? language === "hi"
                ? "🎙️ सुन रहा हूँ..."
                : "🎙️ Listening..."
              : language === "hi"
                ? "🎙️ अपना जवाब बोलें"
                : "🎙️ Speak Answer"}
          </button>
        </div>
      )}

      {/* -----------------------------------------
          COMPLETED
      ----------------------------------------- */}

      {completed && (
        <p>
          ✅{" "}
          {language === "hi"
            ? "शिकायत की जानकारी पूरी हो गई है।"
            : "Complaint information collected."}
        </p>
      )}

      {/* -----------------------------------------
          SHOW EXISTING FORM DATA
      ----------------------------------------- */}

      {started && (
        <div style={{ marginTop: "20px" }}>
          <hr />

          <h3>
            {language === "hi"
              ? "एकत्र की गई जानकारी"
              : "Collected information"}
          </h3>

          <p>
            <strong>
              {language === "hi"
                ? "समस्या:"
                : "Issue:"}
            </strong>{" "}
            {data.title}
          </p>

          <p>
            <strong>
              {language === "hi"
                ? "विवरण:"
                : "Description:"}
            </strong>{" "}
            {data.description}
          </p>

          <p>
            <strong>
              {language === "hi"
                ? "राज्य:"
                : "State:"}
            </strong>{" "}
            {data.state}
          </p>

          <p>
            <strong>
              {language === "hi"
                ? "शहर:"
                : "City:"}
            </strong>{" "}
            {data.city}
          </p>

          <p>
            <strong>
              {language === "hi"
                ? "क्षेत्र/सड़क:"
                : "Street:"}
            </strong>{" "}
            {data.street}
          </p>
        </div>
      )}
    </div>
  );
}

export default VoiceInput;