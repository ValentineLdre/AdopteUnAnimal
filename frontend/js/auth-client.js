(function(){
  const KEY='adopte_staff_session';
  function base(){return (window.APP_CONFIG?.API_BASE_URL||'').replace(/\/$/,'');}
  function session(){try{return JSON.parse(sessionStorage.getItem(KEY)||'null');}catch{return null;}}
  function save(data){sessionStorage.setItem(KEY,JSON.stringify(data));}
  function clear(){sessionStorage.removeItem(KEY);}
  async function api(path,options={}){
    const current=session();
    const headers={...(options.headers||{})};
    if(current?.access_token)headers.Authorization=`Bearer ${current.access_token}`;
    if(options.body && !(options.body instanceof FormData))headers['Content-Type']='application/json';
    const response=await fetch(`${base()}${path}`,{...options,headers});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok){if(response.status===401)clear();throw new Error(payload.error||'Une erreur est survenue.');}
    return payload;
  }
  window.StaffAuth={api,session,save,clear,base};
})();
