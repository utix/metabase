(ns metabase.api.premium-features-test
  (:require
   [clojure.test :refer :all]
   [metabase.public-settings.premium-features :as premium-features]
   [metabase.public-settings.premium-features-test
    :as premium-features-test]
   [metabase.test :as mt]))

(deftest get-token-status-test
  (testing "GET /api/premium-features/token/status"
    (mt/with-dynamic-redefs [premium-features/fetch-token-status (fn [_x]
                                                                   {:valid    true
                                                                    :status   "fake"
                                                                    :features ["test" "fixture"]
                                                                    :trial    false})]
      (mt/with-temporary-setting-values [:premium-embedding-token premium-features-test/random-fake-token]
        (testing "returns correctly"
          (is (= {:valid    true
                  :status   "fake"
                  :features ["test" "fixture"]
                  :trial    false}
                 (mt/user-http-request :crowberto :get 200 "premium-features/token/status"))))

        (testing "requires superusers"
          (is (= "You don't have permissions to do that."
                 (mt/user-http-request :rasta :get 403 "premium-features/token/status")))))))

  (testing "Invalid token format"
    ;; with-temporary-setting-values triggers error in premium-embedding-token :setter
    (mt/with-dynamic-redefs [premium-features/premium-embedding-token (constantly "qwertyuiop")]
      (testing "returns an error"
        (is (= {:valid         false
                :status        "invalid"
                :error-details "Token should be 64 hexadecimal characters."}
               (mt/user-http-request :crowberto :get 200 "premium-features/token/status")))))))
