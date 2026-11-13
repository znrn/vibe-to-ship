// Codex 订阅登录；只读取最终消息，非零退出不接受残留草稿。
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir,homedir} from 'node:os';
import {join} from 'node:path';
import {withGeoPolicy} from '/Volumes/sn850/code/seogeo/lib/content-policy.mjs';
export function runAI(prompt,{readOnly=false,timeout=30*60000,cwd=process.cwd()}={}) {
 prompt=withGeoPolicy(prompt);
 const dir=mkdtempSync(join(tmpdir(),'seo-codex-')),file=join(dir,'answer.txt');
 try {
  const args=['exec','-m',process.env.SEO_CODEX_MODEL||'gpt-6-astra','--ephemeral','-s',readOnly?'read-only':'workspace-write','-c','web_search="live"','-c','sandbox_workspace_write.network_access=true','-o',file,'-'];
  const r=spawnSync(join(homedir(),'.local/bin/codex'),args,{cwd,input:'你是本机 SEO 执行程序。使用你实际可用的文件/搜索/命令工具（提示词中的 Read、Write、WebSearch、WebFetch 是职责描述，不是限定工具名称）。禁止读密钥、提交Git、部署、发帖、发送消息；仅完成指定文件编辑或只读核查。\n'+prompt,encoding:'utf8',timeout,maxBuffer:64*1024*1024});
  return {...r,stdout:existsSync(file)?readFileSync(file,'utf8'):'',stderr:r.status===0?'':(r.stderr||'').slice(-2000)};
 } finally {rmSync(dir,{recursive:true,force:true})}
}
