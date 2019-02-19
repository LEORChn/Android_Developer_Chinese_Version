// ==UserScript==
// @name         Pixiv 辅助翻译
// @namespace    https://greasyfork.org/users/159546
// @version      1.1
// @description  现已支持标签TAG、作品详情页对标题和说明，以及评论区翻译！
// @author       LEORChn
// @include      *://www.pixiv.net/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// ==/UserScript==
var tag_trans=[
    '漫画','漫画',
    'うごイラ','动图',
    '厚塗り','多层上色',
    'UTAU獣人','兽人虚拟歌手',
    '狼音アロ','狼音阿罗',
    'ケモノ','野兽',
    'wolf','狼',
    'kemono','毛怪',
    'furry','兽人',
    '獣人','兽人', // 这个是日文的
    '獸人','兽人', // 这个是繁体的
    'オスケモ','雄兽',
    'デブケモ','胖兽',
    'ケモホモ','兽人同性向',
    'ケモ交尾','兽性',
    '東京放課後サモナーズ','东京放课后召唤师',
    '放サモ','东放',
    'housamo','东放',
    'モリタカ','犬塚戍孝',
    '犬塚モリタカ','犬塚戍孝',
    'ホロケウカムイ','狼神神威', //ID为 20880639 的作者似乎打错了这个标签所以替换不到
    'テムジン','铁木真',
    'ガルム','加姆',
    'ノーマッド(放サモ)','诺曼德（东放）', // 东京放课后里的虎兽人所用的化名
    '主5','5号主人公（东放）',
    'ふんどし','兜裆布',
    '褌','兜裆布',
    'ラバースーツ','橡胶紧身衣',
    '腹筋','腹肌',
    'ㄋㄟㄋㄟ','胸部',
    '金的','捣蛋',
    '猿轡','封口',
    '拘束','捆绑Play'
];
(function(){
    recheck();
})();
function recheck(){
    init();
    if(load())return;
    setTimeout(recheck,100);
}
function init(){ // call once when start loading page
    if(ft('body').length==0) return;
    main_daemon();
    //inited=true; //
}
function load(){ // call once when loaded page
    if(document.readyState.toLowerCase()=='complete'){
        main_daemon();// write code here
        return true;
    }
}
var daemonLauncher;
function main_daemon(){
    if(daemonLauncher) return;
    daemonLauncher = setInterval(main_do, 3000);
    main_do();
}
function main_do(){
    tagTranslate_illust(); // 个人空间的作品列表页面的标签
    tagTranslate_illust_single(); // 作品页面的标签
    tagTranslate_bookmark(); // 个人空间的收藏列表页面的标签
    tagTranslate_addBookmark(); // 添加收藏时的可选择标签
    tagTranslate_member_tag_all();
    detailTranslate_illust();
    trans_comment_button();
}
// ========== 作品页面（单图预览和评论区） 以下
function tagTranslate_illust_single(){
    if(location.pathname != '/member_illust.php')return;
    var tags=$$('figcaption footer>ul>li');
    if(tags.length==0)return;
    for(var li=0;li<tags.length;li++){
        var c=tags[li].childNodes,
            tt=tagDict(c[0].innerText);
        tags[li].style.display='inline-block';
        if(tt){
            c[0].childNodes[0].innerText=tt;
            if(c.length>1) c[1].remove();
        }
    }
}
// ----- 作品页标题和说明 以下
var ID_TRANSLATION_SOURCE='leorchn_icon_google_translate', ICON_TRANSLATION_SOURCE='https://translate.google.cn/favicon.ico',
    ID_TRANSLATED_TITLE = 'leorchn_translated_title',
    ID_TRANSLATED_DESC = 'leorchn_translated_desc',
    block_detail_root;
function detailTranslate_illust(){
    if(location.pathname != '/member_illust.php')return;
    if(!location.href.includes('mode=medium'))return;
    var detail_block_post_time = $('figure>figcaption div[title]');
    if(!detail_block_post_time) return;
    block_detail_root = detail_block_post_time.parentElement;
    if(!fv(ID_TRANSLATION_SOURCE)){
        var img=ct('img'); img.id=ID_TRANSLATION_SOURCE; img.src=ICON_TRANSLATION_SOURCE; img.style.cssText='width:24px; float:right';
        block_detail_root.insertBefore(img, block_detail_root.children[0]);
    }
    trans_title();
    if(!fv(ID_TRANSLATED_DESC))trans_desc();
}
function trans_title(){ // 作品标题
    var p=$('figcaption div>h1'), d=fv(ID_TRANSLATED_TITLE);
    if(!p) return;
    if(d){
        if(d.title == p.innerText) return;
        d.parentElement.remove();
        try{ fv(ID_TRANSLATED_DESC).remove(); }catch(e){}
        d = undefined;
    }
    if(!d){ // 因为标题块没有双层嵌套，二次读取会导致缓存文字块被误翻译
        var q = ct('h1'); d = trans_create_block('');
        q.className = p.className;
        d.id=ID_TRANSLATED_TITLE; d.title=p.innerText;
        q.appendChild(d); p.parentElement.insertBefore(q, p.nextElementSibling);
    }
    googleTranslateProxy(p.innerText, fv(ID_TRANSLATED_TITLE));
}
function trans_desc(){ // 作品描述
    var p=$('figcaption div>h1+div>div');
    if(!p) return;
    if(!fv(ID_TRANSLATED_DESC)){
        var d = trans_create_block('')
        d.id=ID_TRANSLATED_DESC;
        p.parentElement.appendChild(d);
    }
    googleTranslateProxy(p.innerText, fv(ID_TRANSLATED_DESC));
}
// ----- 评论区翻译按钮 以下
var ID_COMMENT_TRANSLATE_TRIGGER = 'leorchn_comment_translate_trigger',
    ID_COMMENT_TRANSLATION_BLOCK = 'leorchn_comment_translation_block';
function trans_comment_button(){
    var p=$$('article section li div>span+span+span');
    for(var i=0;i<p.length;i++){
        var parent = p[i].parentElement;
        if(parent.getElementsByClassName(ID_COMMENT_TRANSLATE_TRIGGER).length == 0){
            var d=ct('span', '翻译');
            d.className=p[i].className + ' ' + ID_COMMENT_TRANSLATE_TRIGGER;
            d.style.marginLeft='16px';
            d.onclick=function(){
                var _this=this,
                    commentRoot=this.parentElement.previousElementSibling;
                if(commentRoot.getElementsByClassName(ID_COMMENT_TRANSLATION_BLOCK).length == 0){
                    var tb = trans_create_block('')
                    tb.className = ID_COMMENT_TRANSLATION_BLOCK;
                    commentRoot.appendChild(tb);
                }
                googleTranslateProxy(commentRoot.children[0].innerText, commentRoot.getElementsByClassName(ID_COMMENT_TRANSLATION_BLOCK)[0]);
            }
            parent.appendChild(d);
        }
    }
}
// ========== 作品页面（单图预览和评论区） 以上
// ========== 自己和其他画师空间 以下
// ----- 主页（显示全部作品、筛选其中一个标签）
function tagTranslate_illust(){
    if(location.pathname != '/member_illust.php')return;
    var tags=$$('div>nav+div>div>div>ul>li');
    if(tags.length==0)return;
    for(var li=0;li<tags.length;li++){
        var c=tags[li].children,
            tt=tagDict(c[0].innerText);
        if(tt){
            c[0].innerText=tt;
        }
    }
}
// ----- 所有已加心的作品 页面
function tagTranslate_bookmark(){
    if(location.pathname != '/bookmark.php')return;
    tagTranslate_mode_tagCloud();
}
// ----- 所有绘制的作品包含的标签（包含频率降序）
function tagTranslate_member_tag_all(){
    if(location.pathname != '/member_tag_all.php')return;
    tagTranslate_mode_tagCloud();
    var tags=fc('tag-list');
    if(tags.length==0)return;
    tags=tags[0].getElementsByTagName('dd');
    for(var dd=0;dd<tags.length;dd++){
        var c=tags[dd].childNodes[0].childNodes;
        for(var li=0;li<c.length;li++){
            var tt=tagDict(c[li].innerText);
            if(tt){
                var atag= c[li].getElementsByTagName('a')[0];
                atag.innerText=tt;
                atag.style.backgroundColor='#ffd040';
            }
        }
    }
}
// ----- 加心/编辑心 页面
function tagTranslate_addBookmark(){
    if(location.pathname != '/bookmark_add.php')return;
    var tags=fc('tag-cloud');
    if(tags.length==0)return;
    for(var g=0,gt=tags;g<gt.length;g++){
        tags=gt[g].childNodes;
        for(var li=0;li<tags.length;li++){
            try{ // 作品自带标签的列表中，“原创”后面竟然跟一个空白的元素不知道为啥
                var c=tags[li].childNodes[0].childNodes,
                    cl=c.length-1,
                    tt=tagDict(c[cl].nodeValue);
                if(tt) c[cl].nodeValue=tt;
            }catch(e){}
        }
    }
}
// ========== 自己和其他画师空间 以上
// ----- 模板：标签云
function tagTranslate_mode_tagCloud(){
    var tags=fc('tagCloud');
    if(tags.length==0)return;
    tags=tags[0].childNodes;
    for(var li=0;li<tags.length;li++){
        try{
            if(tags[li].className.includes('level0')) continue;
        }catch(e){ continue; }
        tags[li].style.display='inline-block';
        var c=tags[li].childNodes[0].childNodes,
            tt=tagDict(c[0].nodeValue);
        if(tt) c[0].nodeValue=tt;
    }
}
// ----- 标签 字典翻译
function tagDict(origin){
    for(var i=0;i<tag_trans.length;i+=2)
        if(origin==tag_trans[i])
            return tag_trans[i+1];
}
// ----- 创建和编辑外部翻译块
function trans_create_block(oriText, existsBlock){
    var n=existsBlock? existsBlock: ct('p');
    n.innerText=oriText? googleTranslate_get(oriText): '翻译中';
    n.style.backgroundColor='#d0ffd0';
    return n;
}
//----- my ezjs lib
function fv(id){return document.getElementById(id);}
function ft(tag){return document.getElementsByTagName(tag);}
function fc(cname){return document.getElementsByClassName(cname);}
function ct(tag, t){var d=document.createElement(tag); if(t)d.innerText=t; return d;}
function $(s){return document.querySelector(s);}
function $$(s){return document.querySelectorAll(s);}
function msgbox(msg){alert(msg);}
function inputbox(title,defalt){return prompt(title,defalt);}
function pl(s){console.log(s);}
function googleTranslateProxy(origText, postTo){
    googleTranslate(origText, function(r){
        if(!r.responseText || r.responseText.length<20) if(googleTranslateProxy(origText, postTo) || true) return;
        trans_create_block(r.responseText, postTo);
    });
}
function googleTranslate_get(origin){
    return new RegExp('<div\\s.{0,15}class=\\"t0\\".{0,15}>(.*)<\\/div><f').exec(origin)[1];
}
function googleTranslate(word,dofun,dofail){
    http('get','https://translate.google.cn/m?hl=zh-CN&sl=auto&tl=zh-CN&ie=UTF-8&prev=_m&q='+encodeURI(word),'',dofun,dofail);
}
function http(_method,_url,formdata,dofun,dofail){
    GM_xmlhttpRequest({
        method: _method.toUpperCase(),
        url: _url,
        data: formdata,
        headers:{},
        onload: dofun,
        onerror: dofail
    });
}
