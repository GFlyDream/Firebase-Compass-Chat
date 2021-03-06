// Import stylesheets
import "./style.css";
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from "firebaseui";

// Document elements

const startRsvpButton = document.getElementById("startRsvp");
const guestbookContainer = document.getElementById("guestbook-container");

const form = document.getElementById("leave-message");
const input = document.getElementById("message");
const guestbook = document.getElementById("guestbook");
const numberAttending = document.getElementById("number-attending");
const rsvpYes = document.getElementById("rsvp-yes");
const rsvpNo = document.getElementById("rsvp-no");
const userIDDisplay = document.getElementById("userID");
var rsvpListener = null;
var guestbookListener = null;

async function main() {
  // Add Firebase project configuration object here
  var firebaseConfig = {
    apiKey: "AIzaSyDzi4zQLHzi3VrcyKks0CbQPjIEoTtjuL0",
    authDomain: "compass-chat-a456c.firebaseapp.com",
    projectId: "compass-chat-a456c",
    storageBucket: "compass-chat-a456c.appspot.com",
    messagingSenderId: "1086683287554",
    appId: "1:1086683287554:web:cf314ef856cb5d9fd3571b",
    measurementId: "G-QQ7VTLNQ8N"
  };

  // Make sure Firebase is initilized
  try {
    if (firebaseConfig && firebaseConfig.apiKey) {
      firebase.initializeApp(firebaseConfig);
    }
    let app = firebase.app();
  } catch (e) {
    console.log(e);
    document.getElementById("app").innerHTML =
      "<h1>Welcome to the Codelab! Add your Firebase config object to <pre>/index.js</pre> and refresh to get started</h1>";
    throw new Error(
      "Welcome to the Codelab! Add your Firebase config object from the Firebase Console to `/index.js` and refresh to get started"
    );
  }

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      }
    }
  };

  const ui = new firebaseui.auth.AuthUI(firebase.auth());

  // Listen to RSVP button clicks
  startRsvpButton.addEventListener("click", () => {
    if (firebase.auth().currentUser) {
      // User is signed in; allows user to sign out
      firebase.auth().signOut();
    } else {
      // No user is signed in; allows user to sign in
      ui.start("#firebaseui-auth-container", uiConfig);
    }
  });

  // Listen to the current Auth state
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      startRsvpButton.textContent = "LOGOUT";
      // Show guestbook to logged-in users
      guestbookContainer.style.display = "block";
      subscribeGuestbook();
      subscribeCurrentRSVP(user);
      userIDDisplay.style.display = "block";
      userIDDisplay.innerHTML = firebase.auth().currentUser.uid;

      const userDoc = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.uid);

      // If they RSVP'd yes, save a document with attending: true
      userDoc
        .set({
          registered: true,
          name: firebase.auth().currentUser.displayName,
          email: firebase.auth().currentUser.email,
          photoUrl: firebase.auth().currentUser.photoURL,
          emailVerified: firebase.auth().currentUser.emailVerified,
          userID: firebase.auth().currentUser.uid
        })
        .catch(console.error);
    } else {
      startRsvpButton.textContent = "RSVP";
      userIDDisplay.style.display = "none";
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = "none";
      unsubscribeGuestbook();
      unsubscribeCurrentRSVP();

      const userDoc = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.uid);

      // If they RSVP'd yes, save a document with attending: true
      userDoc
        .set({
          registered: true,
          name: firebase.auth().currentUser.displayName,
          email: firebase.auth().currentUser.email,
          photoUrl: firebase.auth().currentUser.photoURL,
          emailVerified: firebase.auth().currentUser.emailVerified,
          userID: firebase.auth().currentUser.uid
        })
        .catch(console.error);
    }
  });

  // Listen to the form submission
  form.addEventListener("submit", e => {
    // Prevent the default form redirect
    e.preventDefault();
    // Write a new message to the database collection "guestbook"
    firebase
      .firestore()
      .collection("guestbook")
      .set({
        text: input.value,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        userId: firebase.auth().currentUser.uid
      });
    // clear message input field
    input.value = "";
    // Return false to avoid redirect
    return false;
  });

  // Listen to RSVP responses
  rsvpYes.onclick = () => {
    // Get a reference to the user's document in the attendees collection
    const userDoc = firebase
      .firestore()
      .collection("attendees")
      .doc(firebase.auth().currentUser.uid);

    // If they RSVP'd yes, save a document with attending: true
    userDoc
      .set({
        attending: true,
        name: firebase.auth().currentUser.displayName
      })
      .catch(console.error);
  };

  rsvpNo.onclick = () => {
    // Get a reference to the user's document in the attendees collection
    const userDoc = firebase
      .firestore()
      .collection("attendees")
      .doc(firebase.auth().currentUser.uid);

    // If they RSVP'd yes, save a document with attending: true
    userDoc
      .set({
        attending: false,
        name: firebase.auth().currentUser.displayName
      })
      .catch(console.error);
  };

  // Listen for attendee list
  firebase
    .firestore()
    .collection("attendees")
    .where("attending", "==", true)
    .onSnapshot(snap => {
      const newAttendeeCount = snap.docs.length;

      numberAttending.innerHTML = newAttendeeCount + " people going";
    });
}
main();

// Listen to guestbook updates
function subscribeGuestbook() {
  // Create query for messages
  guestbookListener = firebase
    .firestore()
    .collection("guestbook")
    .orderBy("timestamp", "desc")
    .onSnapshot(snaps => {
      // Reset page
      guestbook.innerHTML = "";
      // Loop through documents in database
      snaps.forEach(doc => {
        // Create an HTML entry for each document and add it to the chat
        const entry = document.createElement("p");
        entry.textContent = doc.data().name + ": " + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
}

// Unsubscribe from guestbook updates
function unsubscribeGuestbook() {
  if (guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}

// Listen for attendee list
function subscribeCurrentRSVP(user) {
  rsvpListener = firebase
    .firestore()
    .collection("attendees")
    .doc(user.uid)
    .onSnapshot(doc => {
      if (doc && doc.data()) {
        const attendingResponse = doc.data().attending;

        // Update css classes for buttons
        if (attendingResponse) {
          rsvpYes.className = "clicked";
          rsvpNo.className = "";
        } else {
          rsvpYes.className = "";
          rsvpNo.className = "clicked";
        }
      }
    });
}

function unsubscribeCurrentRSVP() {
  if (rsvpListener != null) {
    rsvpListener();
    rsvpListener = null;
  }
  rsvpYes.className = "";
  rsvpNo.className = "";
}
