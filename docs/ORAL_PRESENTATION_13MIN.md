# Oral Presentation and Live Demo · 13 minutes

Setup (before the session): `docker compose down -v && docker compose up -d --build`, browser at http://localhost:5174, Swagger at :8000/docs, two MySQL terminals open (`docker exec -it zimbra_mysql mysql -uroot crm_zimbra`), the report's Table 7 already filled in. Keep a recorded fallback of the demo in case Docker fails.

| Time | Speaker | Content | Show |
|---|---|---|---|
| 0:00–1:00 | Sergio | Problem: Zimbra, 200,000 visitors per week, Eloqua failed, OneView solved it. Our goal: reproduce the process as a transactional system. | Slide: case summary and architecture (DB, API, front end) |
| 1:00–2:30 | Sergio | Architecture and security in the app: login, JWT, roles, seller sees only own prospects (403 on `/empleados`). | Login as Admin and as Seller 6; `/api/v1/health` |
| 2:30–4:30 | Juan David | Free trial: T1, generated column `fecha_fin` (error 3105 when writing it), visits with SAVEPOINT, alert once per hour. | Prospect 18 → trial; prospect 19 → visit to `/precios` |
| 4:30–6:30 | Andrés | Proposal and sale: TR-02 computes 900.00; T4 turns the prospect into Customer; errors for proposal 33 and duplicate sale; state history. | Front end + `historial_estado` |
| 6:30–8:00 | Andrés | **Concurrency:** two terminals with `FOR UPDATE` (11_concurrencia.sql, scenario 2/3), then `python scripts/simular_concurrencia.py`: 1 sale out of 10. Mention deadlock and error 1213. | Two terminals + script output |
| 8:00–9:30 | Juan David | **Indexes:** `EXPLAIN` with `IGNORE INDEX` vs. with index (10_explain_indices.sql) on the 10,000-prospect load. | Terminal, `type = ALL` → `ref` |
| 9:30–10:30 | Sergio | **Views and roles:** `SELECT * FROM v_ranking_vendedores`; connect as `crm_vendedor`: `password_hash` and `DELETE` denied. | Terminal + Reports → “SQL views” tab |
| 10:30–11:30 | Sergio | Reports screen: charts, closing rate vs. 10–15 % goal, CSV export. | Front end, Reports |
| 11:30–12:15 | Juan David | Testing and recovery: `pytest -v`, backup and restore scripts. | Terminal |
| 12:15–13:00 | All | Limits (simulated visits, stored score, root account by default) and conclusions: rules in the database, locks prevent duplicates, indexes are trade-offs. | Closing slide |

## Rehearsal rules

- Time the full run once; if it exceeds 13 minutes, shorten the reports tab (10:30–11:30) first.
- Every member must be able to answer questions about any section, not only their own.
- Likely questions: Why FOR UPDATE and also UNIQUE? What does a handler do that MySQL does not do by default? Why store the score? What happens on a deadlock? Why a view instead of a stored procedure? What is the cost of each index?
