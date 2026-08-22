
fetch('data/profile.json').then(r=>r.json()).then(d=>{
name.value=d.name;
bio.value=d.bio;
email.value=d.email;
});

function save(){
alert('Data siap dikirim ke GitHub API pada tahap integrasi token.');
}
