// Only explicit positive results block; substring matching would misread "no_match".
function mediaVerdict(statusCode, data={}) {
 if(statusCode<200||statusCode>=300)return {ok:false,classification:'unavailable'};
 const status=String(data.status||data.classification||data.result||'').toLowerCase();
 const matched=data.match===true||data.matched===true||['match','matched','csam','block','blocked'].includes(status);
 if(matched)return {ok:false,classification:'match'};
 if(data.match===false||data.matched===false||['no_match','unmatched','clear'].includes(status))return {ok:true,classification:status||'clear'};
 return {ok:false,classification:'unavailable'};
}
module.exports={mediaVerdict};
