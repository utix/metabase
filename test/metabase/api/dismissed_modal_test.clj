(ns metabase.api.dismissed-modal-test
  (:require [clojure.test :refer :all]
            [metabase.test :as mt]))

(deftest it-works
  (mt/with-model-cleanup [:model/DismissedModal]
    (mt/user-http-request :rasta :delete 200 "/dismissed-modal/meow")
    (is (false? (mt/user-http-request :rasta :get 200 "/dismissed-modal/meow")))
    (mt/user-http-request :rasta :put 200 "/dismissed-modal/meow")
    (is (true? (mt/user-http-request :rasta :get 200 "/dismissed-modal/meow")))
    (is (false? (mt/user-http-request :rasta :get 200 "/dismissed-modal/other-key")))
    (mt/user-http-request :rasta :delete 200 "/dismissed-modal/meow")
    (is (false? (mt/user-http-request :rasta :get 200 "/dismissed-modal/meow")))))
