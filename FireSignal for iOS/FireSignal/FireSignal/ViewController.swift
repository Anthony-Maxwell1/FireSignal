//
//  ViewController.swift
//  FireSignal
//
//  Created by Anthony Maxwell on 27/10/2023.
//

import UIKit
import WebKit

class ViewController: UIViewController, WKUIDelegate {
    var webView = WKWebView()

    override func viewDidLoad() {
        super.viewDidLoad()
        
        webView = WKWebView(frame: .zero)
        self.view.addSubview(webView)
        
        let URL = URL(string: "https://maps.google.com")
        let Request = URLRequest(url: URL!)
        webView.load(Request)
    }
}
