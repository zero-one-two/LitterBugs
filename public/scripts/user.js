const storedSessionKey = Object.keys(sessionStorage).filter((key) =>
  key.startsWith("firebase:authUser")
);

//Stores user data in session storage
const userData = sessionStorage[storedSessionKey] || {};

//Checks if current user is authenticated
firebase.auth().onIdTokenChanged((user) => {
  if (!user) {
    window.location = "login.html";
  } else {
    getUserData();
  }
});

function setUserData(uid) {
  db.collection("users")
    .doc(uid)
    .set({
      email: JSON.parse(userData).email,
      name: JSON.parse(userData).name,
      notifications: true,
      iconPack: pack1,
      level: 1,
    })
    .then((doc) => storeUserLocally(doc.data(), doc.id))
    .catch((err) => console.log(err), logout());
}

function getUserData() {
  let uid = JSON.parse(userData).uid;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        $("#displayNameEdit").val(doc.data().name);
        storeUserLocally(doc.data(), doc.id);
        if (doc.data().notifications == true) {
            iconSelect(doc.data().iconPack)
            $("#notificationsOn").addClass("active");
            $("#notificationsOn").attr("checked", true);
        } else {
            $("#notificationsOff").addClass("active");
            $("#notificationsOff").attr("checked", "checked");
        }
      } else {
        setUserData(uid);
      }
    })
    .catch((err) => {
      console.log("Error getting user data! " + err);
    });
}

//updates user data based on modal entry.
async function updateUser(newName, notify, iconpack) {
    const userData = JSON.parse(sessionStorage.getItem("userData"))
    const name = newName || userData.name;
    const iconpackChoice = iconpack || userData.iconPack;
    const notifcations = notify || userData.notifications;
    await db.collection("users").doc(userData.uid).update({
        name: name,
        notifications : notifcations,
        iconPack : iconpackChoice
    }).then(() => {
        console.log("user updated");
    }).catch((err) => {console.log("Error updating user data: " + err)})
}

function storeUserLocally(data, userID) {
  data.uid = userID;
  data = JSON.stringify(data);
  sessionStorage.setItem("userData", data);
}

function logout() {
  sessionStorage.clear();
  window.location = "login.html";
}
