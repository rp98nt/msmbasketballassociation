document.getElementById("contact-form").addEventListener("submit", submitForm);

function submitForm(e) {
  e.preventDefault();

  var name = getElementVal("name");
  var email = getElementVal("email");
  var phoneEl = document.getElementById("phone");
  var phone = phoneEl ? phoneEl.value.trim() : "";
  var msg = getElementVal("msg");

  fetch(msmApiUrl("/api/contact"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, email: email, phone: phone, msg: msg }),
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
        alert("Your message was sent successfully.");
      }
      document.getElementById("contact-form").reset();
    })
    .catch(function () {
      alert("Could not send message. Please try again later.");
    });
}

const getElementVal = (id) => {
  return document.getElementById(id).value;
};
