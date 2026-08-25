import { existsSync, unlinkSync } from 'node:fs';
import { DB_PATH, getDb, closeDb } from './db.js';
if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
const db = getDb();
db.prepare('INSERT INTO accounts(id,platform,name,handle) VALUES (?,?,?,?)').run('engineer_career_x','x','エンジニア転職ラボ','@career_engineer');
const insert = db.prepare('INSERT INTO posts(account_id,platform,content,theme,hook_type,content_type,cta_type,variant,status,review_score,review_notes,scheduled_at,posted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
const rows = [
['SESから抜けたい人へ。転職前に見るべき数字は求人件数ではなく、直近1年で説明できる成果の数です。まず「改善前→自分の行動→改善後」を3つ書き出す。職務経歴書も面接も、ここから一気に話しやすくなります。','経験の棚卸し','number','how_to','bookmark','B','pending_human_review',86,'対象と行動が具体的。CTAも自然。',null,null],
['僕が転職面接で3社続けて落ちた原因は、技術不足ではなく「何を考えて動いたか」を話せなかったことでした。担当した作業ではなく、判断の理由を1つ添える。それだけで会話が変わりました。','面接失敗談','confession','story','none','C','pending_human_review',84,'実体験に具体性あり。根拠を誇張していない。',null,null],
['年収500万円から上がらないとき、資格をもう1つ取る前に確認したい3項目。\n・成果を数字で言える\n・上流の判断を説明できる\n・次の会社で再現できる\n足りない項目が、次の90日で作る経験です。','年収アップ','number','checklist','bookmark','D','pending_human_review',88,'数字とチェックリストで保存動機が強い。',null,null],
['SES転職で焦って応募数を増やす前に、案件で任された判断をメモしておく。小さくても自分で考えた証拠が、面接では強い材料になります。','転職準備','warning','how_to','none','A','scheduled',82,'簡潔で実行可能。','2026-08-25T21:00:00+09:00',null],
['「スキルがないから転職できない」と思っていた僕が先に変えたのは、スキルではなく実績の伝え方でした。改善した時間、減らしたミス、助けた人数。数字にすると経験が見える。','実績の伝え方','contrarian','story','profile','E','posted',87,'逆説と具体例が機能。',null,'2026-08-24T12:10:00+09:00'],
['SESで市場価値が不安なら、今週やることは1つ。直近の仕事で「自分が決めたこと」を5個書く。設計でなくても、確認順や切り分け方も立派な判断材料です。','市場価値','number','how_to','bookmark','B','posted',85,'対象・期限・行動が明確。',null,'2026-08-23T21:00:00+09:00'],
['転職活動は準備が大切です。自分を見つめ直して、理想のキャリアを考えましょう。プロフィールも見てください。','転職準備','curiosity','opinion','profile','A','posted',61,'抽象的で既視感が強く、CTAが唐突。',null,'2026-08-22T07:30:00+09:00'],
['エンジニアなら勉強を続けましょう。努力すれば未来は変わります。','学習','future','opinion','none','A','posted',58,'対象の悩みと具体的行動がない。',null,'2026-08-21T07:30:00+09:00']
];
const metricRows = [[5,18200,410,22,84,196,520,185,64,160,7,42000],[6,12100,355,19,61,248,448,96,51,82,3,18000],[7,4600,48,2,8,9,34,9,3,5,0,0],[8,3100,35,1,4,3,20,2,1,2,0,0]];
for (const row of rows) insert.run('engineer_career_x','x',...row);
const metric = db.prepare('INSERT INTO post_metrics(post_id,impressions,likes,replies,reposts,bookmarks,profile_clicks,link_clicks,follows,affiliate_clicks,conversions,revenue) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
for (const row of metricRows) metric.run(...row);
const insight = db.prepare('INSERT INTO insights(kind,title,data_text,interpretation,action,source,sample_size,period,confidence) VALUES (?,?,?,?,?,?,?,?,?)');
insight.run('winner','SES明示でプロフィールCTRが上昇','SESを冒頭20文字以内に含む投稿: 2.7% / その他: 1.5%','読者が自分向けだと即座に判断できています。','次週21投稿のうち7投稿で「SES」を冒頭に置いて再検証する。','local_demo.post_metrics',12,'過去30日','medium');
insight.run('timing','21時投稿の反応が高い','21時の平均ER 5.4% / 7時 2.8%','仕事後の閲覧時間と合っている可能性があります。','同テーマを7時・21時に各5本配信する比較実験を提案する。','local_demo.post_metrics',10,'過去30日','low');
insight.run('funnel','最大ボトルネックはリンクCTR','プロフィール到達520件に対しリンククリック185件（35.6%）','投稿からプロフィールまでは機能し、プロフィール内導線に改善余地があります。','プロフィール見出しのベネフィットを2案で比較する。','local_demo.funnel',4,'過去7日','insufficient_data');
console.log(`Seeded ${DB_PATH}`);
closeDb();
