document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);


  // By default, load the inbox
  load_mailbox('inbox'); 
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const element = document.createElement('div');

        element.classList.add('email');
        if (email.read) {
          element.classList.add('read')
        }

        element.innerHTML = `
          <div>
            <h2>${email.sender}</h2>
            <h3>${email.body}</h3>
          </div>
          <h4>${email.timestamp}</h4>
        `

        element.addEventListener('click', () => load_email(email.id, mailbox))
        document.querySelector("#emails-view").append(element)
      })
    })
}


function load_email(email_id, mailbox) {


  // Show the email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      const element = document.querySelector('#email-view')
      element.innerHTML = `
        <h2 class="title">From: <span>${email.sender}</span> </h2>
        <h2 class="title">To: <span>${email.recipients}</span> </h2>
        <h2 class="title">Subject: <span>${email.subject}</span></h2>
        <h2 class="title">Timestamp: <span>${email.timestamp}</span></h2>
        <br>
        <br>
        <span> ${email.body} </span>
        <br>
      `

      // mark email as read
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      if (mailbox != 'sent') {
        // archive and unarchive the email
        const buttonArchive = document.createElement('button');
        buttonArchive.classList.add("btn")
        buttonArchive.classList.add("btn-outline-danger")
        buttonArchive.classList.add("btn-sm")
        buttonArchive.innerHTML = email.archived ? "Unarchive" : "Archive";
        buttonArchive.addEventListener('click', function() {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
          }).then(() => load_mailbox('archive'));
        });

        document.querySelector('#email-view').append(buttonArchive);
      }


      // reply button
      const replyBtn = document.createElement('button');
      replyBtn.classList.add("btn")
      replyBtn.classList.add("btn-outline-info")
      replyBtn.classList.add("btn-sm")
      replyBtn.innerHTML = "Reply";
      replyBtn.addEventListener('click', function() {
        compose_email();

        let subject = email.subject;
        if (subject.split(' ', 1)[0] != 'Re:' ) {
          subject = `Re: ${subject}`
        }

        document.querySelector('#compose-recipients').value = email.sender ;
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      })

      document.querySelector('#email-view').append(replyBtn);
    })
}



function send_email(event) {

  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // send email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    load_mailbox('sent')
  });
  
}