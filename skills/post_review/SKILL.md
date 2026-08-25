# post review

## Purpose
前工程の構造化された成果物を受け取り、根拠の追跡可能な成果物を次工程へ渡す。

## Guardrails
- 入力にない事実を生成しない。
- source / sample_size / period / confidenceを保持する。
- データ不足はinsufficient_dataとする。
- 本番投稿・current_rules更新・重大判断を自動実行しない。
