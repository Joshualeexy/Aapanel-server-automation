const aap = require('./aapanel');

  (async () => {
    const res = await aap('/system?action=GetSystemTotal', {})
    console.log(res)
  })()


