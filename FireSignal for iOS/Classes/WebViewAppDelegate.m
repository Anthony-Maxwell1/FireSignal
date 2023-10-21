#import "WebViewAppDelegate.h"
#import "WebViewController.h"

@implementation WebViewAppDelegate

@synthesize window, navigationController;


#pragma mark -
#pragma mark Application lifecycle

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
	navigationController = [[UINavigationController alloc] init];
    navigationController.navigationBar.hidden = YES;
    navigationController.toolbar.barStyle = UIBarStyleBlack;
	WebViewController *webViewController = [[WebViewController alloc] init];
	webViewController.urlString = @"maps.google.com";
	
	[navigationController pushViewController:webViewController animated:NO];
	[webViewController release];
	
    [self.window setRootViewController:navigationController];
    
    [self.window makeKeyAndVisible];
    
    return YES;
}


- (void)applicationWillResignActive:(UIApplication *)application {}


- (void)applicationDidEnterBackground:(UIApplication *)application {}


- (void)applicationWillEnterForeground:(UIApplication *)application {}


- (void)applicationDidBecomeActive:(UIApplication *)application {}


- (void)applicationWillTerminate:(UIApplication *)application {}


#pragma mark -
#pragma mark Memory management

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {}


- (void)dealloc {
	[navigationController release];
    [window release];
    [super dealloc];
}


@end
