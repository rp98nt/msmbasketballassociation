document.getElementById("registration").addEventListener("submit", submitForm);

function submitForm(e) {
  e.preventDefault();

  var name = getElementVal("name");
  var email = getElementVal("email");
  var phone = getElementVal("phone");
  var event = getElementVal("event");

  fetch(msmApiUrl("/api/registration"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, email: email, phone: phone, event: event }),
  })
    .then(function (r) {
      if (!r.ok) throw new Error("Request failed");
      return r.json();
    })
    .then(function () {
      var el = document.querySelector(".alert");
      if (el) {
        el.style.display = "block";
        setTimeout(function () {
          el.style.display = "none";
        }, 3000);
      } else {
        alert("Registration submitted successfully.");
      }
      document.getElementById("registration").reset();
    })
    .catch(function () {
      alert("Could not submit registration. Please try again later.");
    });
}

const getElementVal = (id) => {
  return document.getElementById(id).value;
};
