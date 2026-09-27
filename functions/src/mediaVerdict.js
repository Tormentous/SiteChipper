// Only explicit positive results block; substring matching would misread "no_match".
function mediaVerdict(statusCode, data={}) {
 if(statusCode<200||statusCode>=300)return {ok:false,classification:'unavailable'};
 const status=String(data.status||data.classification||data.result||'').toLowerCase();
 const matched=data.match===true||data.matched===true||['match','matched','csam','block','blocked'].includes(status);
 return {ok:!matched,classification:matched?'match':status||'clear'};
}
module.exports={mediaVerdict};
