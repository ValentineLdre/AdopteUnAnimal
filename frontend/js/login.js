const form=document.getElementById('loginForm');
const errorBox=document.getElementById('loginError');
const button=document.getElementById('loginButton');
if(StaffAuth.session()?.access_token)location.replace('administration.html');
form.addEventListener('submit',async event=>{
  event.preventDefault();errorBox.hidden=true;button.disabled=true;button.textContent='Connexion…';
  try{
    const payload=await StaffAuth.api('/api/auth/login',{method:'POST',body:JSON.stringify({username:form.username.value,password:form.password.value})});
    StaffAuth.save(payload);location.replace('administration.html');
  }catch(error){errorBox.textContent=error.message;errorBox.hidden=false;}
  finally{button.disabled=false;button.textContent='Se connecter';}
});
