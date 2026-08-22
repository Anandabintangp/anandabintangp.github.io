
fetch('data/profile.json').then(r=>r.json()).then(d=>{
document.getElementById('bio').innerText=d.bio;
document.getElementById('email').innerText=d.email;
});

fetch('data/publications.json').then(r=>r.json()).then(d=>{
document.getElementById('pub').innerHTML=d.map(x=>`<article><b>${x.year}</b><br>${x.title}<br><i>${x.journal}</i></article>`).join('');
});
