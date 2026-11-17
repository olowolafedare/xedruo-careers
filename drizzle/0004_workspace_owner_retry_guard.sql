CREATE UNIQUE INDEX "hireuo_company_memberships_one_active_owner_per_account_uidx"
ON "hireuo_company_memberships" USING btree ("account_id")
WHERE "role" = 'owner' AND "status" = 'active';
